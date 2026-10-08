"""Stationary forecast + simulation helpers + comm reliability."""
import math
from datetime import datetime, timedelta
from .prediction_service import predict_single


def _daily_context(hour: int) -> dict:
    """Deterministic hour-of-day context (pure function of hour, so the same
    24h forecast is identical on every call — stable for demos and tests).

    Night is quiet (low load, few events); mornings and especially evenings
    congest; weather drifts slowly through the day. Only load varied before,
    which is why scores sat flat near 60 — now every input breathes.
    """
    evening = 18 <= hour <= 21
    morning = 8 <= hour <= 10
    night = hour <= 5 or hour >= 23
    load = 38 + (25 if evening else 0) + (10 if morning else 0) + (8 if hour == 19 else 0)
    load += round(3 * math.sin(hour * 1.3))  # gentle deterministic ripple
    load = min(96, max(8, load - (20 if night else 0)))
    hist = 88 - (10 if evening else 0) - (4 if morning else 0) + (2 if night else 0)
    hist += round(2 * math.sin(hour * 0.9 + 1))
    event = 0.55 if evening else (0.40 if morning else (0.10 if night else 0.25))
    event = round(min(1, max(0, event + 0.05 * math.sin(hour * 2.1))), 3)
    weather = round(min(1.0, max(0.85, 0.95 + 0.05 * math.sin(hour * 0.5 - 1))), 3)
    tower = round(0.6 + 0.15 * math.sin(hour * 0.7) - (0.25 if night else 0), 2)
    return {"network_load": load, "historical_quality": hist,
            "event_density": event, "weather_factor": weather,
            "tower_distance": tower}


def stationary_forecast(lat=13.0337, lon=77.5649, start_hour=None, hours=3, step_min=30):
    if start_hour is None:
        start_hour = datetime.now().hour
    pts = []
    t = datetime.now().replace(minute=0, second=0, microsecond=0)
    # align to start_hour today
    t = t.replace(hour=start_hour)
    for k in range(int(hours * 60 / step_min) + 1):
        clock = t + timedelta(minutes=step_min * k)
        ctx = _daily_context(clock.hour)
        payload = {
            "latitude": lat, "longitude": lon, "hour": clock.hour,
            "day_of_week": datetime.now().weekday(), "speed": 0,
            **ctx,
        }
        r = predict_single(payload)
        pts.append({"time": clock.strftime("%H:%M"), "label": clock.strftime("%I:%M %p").lstrip("0"),
                    **r, "network_load": ctx["network_load"]})
    return pts


def comm_reliability(score: float) -> dict:
    """Separate reliability per modality (rule-based mapping from score)."""
    voice = round(min(99, max(5, score * 0.9 + 18)), 1)
    video = round(min(99, max(3, score * 1.05 - 12)), 1)
    text = round(min(99.5, max(40, 88 + (score - 50) * 0.15)), 1)
    net = round(min(99, max(5, score)), 1)
    return {"voice": voice, "video": video, "text": text, "internet": net}
