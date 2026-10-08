"""Route forecast: predefined demo corridor Bengaluru -> Chennai.
Prototype simulation route — NOT real telecom coverage.
Generates 60 segments, predicts each with ML model, groups poor zones.
"""
import math
from datetime import datetime, timedelta
from .prediction_service import predict_single, score_to_status
from .recommendation_service import build_recommendations, cause_for

# [name, lat, lon]
WAYPOINTS = [
    ("Bengaluru", 12.9716, 77.5946),
    ("Hosur", 12.7402, 77.8253),
    ("Krishnagiri", 12.5186, 78.2137),
    ("Dharmapuri", 12.1211, 78.1582),
    ("Salem", 11.6643, 78.1460),
    ("Attur", 11.6000, 78.6000),
    ("Vellore", 12.9165, 79.1325),
    ("Chennai", 13.0827, 80.2707),
]

SPEEDS = {"train": 85, "car": 65, "bus": 55}

# Intentional quality profile along normalized progress t in [0,1]:
# good -> good -> unstable -> POOR -> unstable -> fair/good -> good
def zone_profile(t: float):
    """Returns (tower_distance, network_load, historical_quality, event_density, weather, place_bias)."""
    if t < 0.16:
        return (0.35, 28, 90, 0.12, 1.0)    # Bengaluru urban good
    if t < 0.30:
        return (0.7, 45, 78, 0.25, 0.97)     # Hosur fair/good
    if t < 0.42:
        return (1.5, 68, 58, 0.45, 0.90)     # Krishnagiri approach unstable
    if t < 0.58:
        return (2.6, 88, 38, 0.70, 0.82)     # Dharmapuri gap POOR
    if t < 0.68:
        return (1.7, 72, 52, 0.55, 0.88)     # Salem unstable
    if t < 0.82:
        return (0.9, 50, 72, 0.30, 0.95)     # Vellore corridor fair
    return (0.4, 30, 88, 0.15, 1.0)          # Chennai good


def haversine(a, b):
    R = 6371.0
    dlat = math.radians(b[0] - a[0])
    dlon = math.radians(b[1] - a[1])
    h = math.sin(dlat / 2) ** 2 + math.cos(math.radians(a[0])) * math.cos(math.radians(b[0])) * math.sin(dlon / 2) ** 2
    return 2 * R * math.asin(math.sqrt(h))


def interpolate_route(n=60):
    # piecewise linear through waypoints
    seg_lengths = []
    for i in range(len(WAYPOINTS) - 1):
        a = (WAYPOINTS[i][1], WAYPOINTS[i][2])
        b = (WAYPOINTS[i + 1][1], WAYPOINTS[i + 1][2])
        seg_lengths.append(haversine(a, b))
    total = sum(seg_lengths)
    pts = []
    for k in range(n):
        target = total * k / (n - 1)
        acc = 0.0
        for i, L in enumerate(seg_lengths):
            if acc + L >= target or i == len(seg_lengths) - 1:
                f = 0 if L == 0 else (target - acc) / L
                f = max(0, min(1, f))
                lat = WAYPOINTS[i][1] + f * (WAYPOINTS[i + 1][1] - WAYPOINTS[i][1])
                lon = WAYPOINTS[i][2] + f * (WAYPOINTS[i + 1][2] - WAYPOINTS[i][2])
                # nearest place name
                pts.append((lat, lon, WAYPOINTS[i][0] if f < 0.5 else WAYPOINTS[i + 1][0]))
                break
            acc += L
    return pts, total


def nearest_place(progress_places, idx):
    return progress_places[idx]


def parse_departure(dep: str) -> datetime:
    try:
        h, m = map(int, dep.split(":"))
    except Exception:
        h, m = 18, 0
    now = datetime.now().replace(hour=h, minute=m, second=0, microsecond=0)
    return now


def forecast(origin="Bengaluru", destination="Chennai", departure_time="18:00",
             transport_mode="train", day_of_week=4, n_segments=60):
    pts, total_km = interpolate_route(n_segments)
    speed = SPEEDS.get(transport_mode, 68)
    total_min = int(round(total_km / speed * 60))
    t0 = parse_departure(departure_time)
    try:
        dep_h = int(departure_time.split(":")[0])
    except Exception:
        dep_h = 18

    segments = []
    per_seg_min = total_min / n_segments
    for i, (lat, lon, place) in enumerate(pts):
        t = i / max(1, n_segments - 1)
        tower, load, hist, event, weather = zone_profile(t)
        # small deterministic jitter so predictions aren't perfectly flat
        jitter = math.sin(i * 2.3) * 3
        elapsed = per_seg_min * i
        clock = t0 + timedelta(minutes=elapsed)
        hour = clock.hour
        # evening peak adds load
        peak_boost = 8 if 18 <= hour <= 21 else 0
        payload = {
            "latitude": round(lat, 5),
            "longitude": round(lon, 5),
            "hour": hour,
            "day_of_week": day_of_week,
            "speed": float(speed + math.sin(i) * 4),
            "tower_distance": round(max(0.15, tower + math.sin(i * 1.7) * 0.15), 2),
            "network_load": round(min(99, max(5, load + peak_boost + jitter)), 1),
            "historical_quality": round(min(98, max(10, hist - peak_boost * 0.3 + math.cos(i) * 2)), 1),
            "weather_factor": weather,
            "event_density": round(min(1, max(0, event + math.sin(i * 0.9) * 0.05)), 3),
        }
        r = predict_single(payload)
        segments.append({
            "segment": i,
            "latitude": payload["latitude"],
            "longitude": payload["longitude"],
            "place": place,
            "time": clock.strftime("%H:%M"),
            "speed": round(payload["speed"], 1),
            "tower_distance": payload["tower_distance"],
            "network_load": payload["network_load"],
            "historical_quality": payload["historical_quality"],
            "weather_factor": payload["weather_factor"],
            "event_density": payload["event_density"],
            "quality_score": r["connectivity_score"],
            "status": r["status"],
            "confidence": r["confidence"],
            "signal_strength": r["signal_strength"],
            "latency": r["latency"],
            "throughput": r["throughput"],
        })

    # Aggregate minutes by status
    good_min = sum(per_seg_min for s in segments if s["status"] == "good")
    unstable_min = sum(per_seg_min for s in segments if s["status"] == "unstable")
    poor_min = sum(per_seg_min for s in segments if s["status"] == "poor")
    fair_min = sum(per_seg_min for s in segments if s["status"] == "fair")
    # Merge good+fair for headline? Keep separate but headline uses good(incl fair?) Spec wants GOOD/UNSTABLE/POOR.
    # We'll report good = good+fair for simplicity in headline triple, keep fair_min too.
    headline_good = int(round(good_min + fair_min))

    # Detect poor/unstable zones (contiguous poor or unstable runs, keep poor-priority)
    poor_zones = []
    i = 0
    km_per_seg = total_km / n_segments
    while i < n_segments:
        if segments[i]["status"] == "poor":
            j = i
            while j + 1 < n_segments and segments[j + 1]["status"] == "poor":
                j += 1
            dur = int(round((j - i + 1) * per_seg_min))
            avg_conf = round(sum(s["confidence"] for s in segments[i:j + 1]) / (j - i + 1), 2)
            cause = cause_for(
                sum(s["network_load"] for s in segments[i:j + 1]) / (j - i + 1),
                sum(s["tower_distance"] for s in segments[i:j + 1]) / (j - i + 1),
                sum(s["historical_quality"] for s in segments[i:j + 1]) / (j - i + 1),
            )
            poor_zones.append({
                "start_segment": i, "end_segment": j,
                "start_time": segments[i]["time"], "end_time": segments[j]["time"],
                "duration_min": max(dur, 2),
                "distance_km_ahead": None,
                "cause": cause, "confidence": avg_conf,
            })
            i = j + 1
        else:
            i += 1

    warnings = []
    for z in poor_zones:
        warnings.append(
            f"Poor connectivity predicted near {segments[z['start_segment']]['place']} "
            f"({z['start_time']}–{z['end_time']}, ~{z['duration_min']} min). Cause: {z['cause']}."
        )
    # next unstable warning
    for s in segments:
        if s["status"] == "unstable":
            warnings.append(f"Unstable stretch near {s['place']} around {s['time']} — prefer audio over video.")
            break

    first_poor_in = None
    for z in poor_zones:
        first_poor_in = z["start_segment"] * per_seg_min
        break
    recs = build_recommendations(
        score=min((s["quality_score"] for s in segments), default=70),
        status="poor" if poor_zones else "unstable",
        minutes_to_poor=first_poor_in,
        has_video_call=True, video_call_in_min=45,
    )

    hrs = total_min // 60
    mins = total_min % 60
    return {
        "origin": origin, "destination": destination,
        "departure_time": departure_time, "transport_mode": transport_mode,
        "total_km": round(total_km, 1),
        "total_min": total_min,
        "total_label": f"{hrs}h {mins:02d}m",
        "good_min": headline_good,
        "unstable_min": int(round(unstable_min)),
        "poor_min": int(round(poor_min)),
        "fair_min": int(round(fair_min)),
        "route": [[s["latitude"], s["longitude"]] for s in segments],
        "segments": segments,
        "poor_zones": poor_zones,
        "warnings": warnings,
        "recommendations": recs,
        "fallback": False,
    }
