"""Feature engineering shared by training and inference."""
import numpy as np


def build_features(payload: dict) -> list:
    hour = payload["hour"]
    dow = payload["day_of_week"]
    hour_sin = float(np.sin(2 * np.pi * hour / 24))
    hour_cos = float(np.cos(2 * np.pi * hour / 24))
    peak = 1 if (8 <= hour <= 10 or 18 <= hour <= 21) else 0
    weekend = 1 if dow >= 5 else 0
    return [
        payload["latitude"], payload["longitude"], hour, dow,
        payload.get("speed", 50),
        payload.get("tower_distance", 1.0),
        payload.get("network_load", 50),
        payload.get("historical_quality", 65),
        payload.get("weather_factor", 0.95),
        payload.get("event_density", 0.3),
        hour_sin, hour_cos, peak, weekend,
    ]


FEATURE_COLUMNS = [
    "latitude", "longitude", "hour", "day_of_week", "speed",
    "tower_distance", "network_load", "historical_quality",
    "weather_factor", "event_density",
    "hour_sin", "hour_cos", "peak_hour", "is_weekend",
]
