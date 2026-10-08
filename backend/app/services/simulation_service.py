"""Stationary forecast + simulation helpers + comm reliability."""
from datetime import datetime, timedelta
from .prediction_service import predict_single


def stationary_forecast(lat=13.0337, lon=77.5649, start_hour=None, hours=3, step_min=30):
    if start_hour is None:
        start_hour = datetime.now().hour
    pts = []
    t = datetime.now().replace(minute=0, second=0, microsecond=0)
    # align to start_hour today
    t = t.replace(hour=start_hour)
    for k in range(int(hours * 60 / step_min) + 1):
        clock = t + timedelta(minutes=step_min * k)
        # evening congestion curve: load peaks 19-20
        peak = 25 if 18 <= clock.hour <= 21 else (10 if 8 <= clock.hour <= 10 else 0)
        load = min(96, 38 + peak + (8 if clock.hour == 19 else 0))
        payload = {
            "latitude": lat, "longitude": lon, "hour": clock.hour,
            "day_of_week": datetime.now().weekday(), "speed": 0,
            "tower_distance": 0.6, "network_load": load,
            "historical_quality": 78, "weather_factor": 0.94, "event_density": 0.35,
        }
        r = predict_single(payload)
        pts.append({"time": clock.strftime("%H:%M"), "label": clock.strftime("%I:%M %p").lstrip("0"),
                    **r, "network_load": load})
    return pts


def comm_reliability(score: float) -> dict:
    """Separate reliability per modality (rule-based mapping from score)."""
    voice = round(min(99, max(5, score * 0.9 + 18)), 1)
    video = round(min(99, max(3, score * 1.05 - 12)), 1)
    text = round(min(99.5, max(40, 88 + (score - 50) * 0.15)), 1)
    net = round(min(99, max(5, score)), 1)
    return {"voice": voice, "video": video, "text": text, "internet": net}
