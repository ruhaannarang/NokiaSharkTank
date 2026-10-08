"""Core prediction service: ML inference + transparent prototype confidence."""
import numpy as np
from ..ml.model_loader import get_model
from ..ml.feature_engineering import build_features


def score_to_status(s: float) -> str:
    if s <= 30:
        return "poor"
    if s <= 55:
        return "unstable"
    if s <= 75:
        return "fair"
    return "good"


def heuristic_score(p: dict) -> float:
    tower_comp = 100 * np.exp(-p.get("tower_distance", 1.0) / 1.2)
    load_comp = 100 - p.get("network_load", 50)
    s = (0.30 * p.get("historical_quality", 65) + 0.28 * load_comp
         + 0.22 * tower_comp + 0.10 * p.get("weather_factor", 0.95) * 100
         - p.get("event_density", 0.3) * 8)
    return float(np.clip(s, 4, 98))


def prototype_confidence(score: float, p: dict, used_ml: bool) -> float:
    """Transparent prototype confidence (not a calibrated probability).
    Based on: model MAE (~3.6), distance from extremes, tower/event uncertainty.
    """
    base = 0.93 if used_ml else 0.72
    penalty = abs(score - 55) / 400.0
    penalty += p.get("tower_distance", 1.0) * 0.012
    penalty += p.get("event_density", 0.3) * 0.05
    penalty += (1.0 - p.get("weather_factor", 0.95)) * 0.08
    return round(float(np.clip(base - penalty, 0.60, 0.97)), 2)


def derive_radio(score: float, rng: np.random.Generator | None = None):
    signal = round(float(-50 - (100 - score) * 0.62), 1)
    latency = round(float(max(8, 14 + (100 - score) * 1.75)), 1)
    throughput = round(float(max(0.4, (score / 100) ** 2 * 85)), 1)
    return signal, latency, throughput


def explain(p: dict, score: float) -> dict:
    return {
        "network_load": round(float(p.get("network_load", 50)), 1),
        "tower_distance": round(float(p.get("tower_distance", 1.0)), 2),
        "historical_quality": round(float(p.get("historical_quality", 65)), 1),
        "event_density": round(float(p.get("event_density", 0.3)), 2),
        "weather_factor": round(float(p.get("weather_factor", 0.95)), 2),
        "summary": _summary_text(p),
    }


def _summary_text(p: dict) -> str:
    parts = []
    if p.get("network_load", 50) >= 75:
        parts.append("high expected network load")
    elif p.get("network_load", 50) >= 55:
        parts.append("moderate network load")
    else:
        parts.append("low network load")
    if p.get("tower_distance", 1.0) >= 2.0:
        parts.append("weak tower availability")
    elif p.get("tower_distance", 1.0) >= 1.2:
        parts.append("moderate tower distance")
    else:
        parts.append("strong nearby tower coverage")
    if p.get("historical_quality", 65) < 50:
        parts.append("historically lower reliability in this segment")
    else:
        parts.append("historically stable segment")
    return "; ".join(parts) + "."


def predict_single(p: dict) -> dict:
    model = get_model()
    used_ml = model is not None
    if used_ml:
        try:
            import pandas as _pd
            from ..ml.feature_engineering import FEATURE_COLUMNS
            feats = build_features(p)
            X = _pd.DataFrame([feats], columns=FEATURE_COLUMNS)
            score = float(np.clip(model.predict(X)[0], 2, 99))
        except Exception:
            score = heuristic_score(p)
            used_ml = False
    else:
        score = heuristic_score(p)
    score = round(score, 1)
    status = score_to_status(score)
    conf = prototype_confidence(score, p, used_ml)
    signal, latency, throughput = derive_radio(score)
    return {
        "connectivity_score": score,
        "status": status,
        "confidence": conf,
        "signal_strength": signal,
        "latency": latency,
        "throughput": throughput,
        "explanation": explain(p, score),
        "model": "ml" if used_ml else "heuristic-fallback",
    }
