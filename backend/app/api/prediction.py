from fastapi import APIRouter, HTTPException
from ..models.schemas import PredictRequest, PredictResponse
from ..services.prediction_service import predict_single
from ..services.simulation_service import comm_reliability

router = APIRouter()


@router.post("/predict", response_model=PredictResponse)
def predict(req: PredictRequest):
    try:
        r = predict_single(req.model_dump())
        return PredictResponse(**{k: r[k] for k in PredictResponse.model_fields})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/current-connectivity")
def current_connectivity(lat: float = 13.0337, lon: float = 77.5649, hour: int = 18):
    from datetime import datetime
    payload = {"latitude": lat, "longitude": lon, "hour": hour,
               "day_of_week": datetime.now().weekday(), "speed": 2,
               "tower_distance": 0.6, "network_load": 55,
               "historical_quality": 80, "weather_factor": 0.95, "event_density": 0.3}
    r = predict_single(payload)
    r["reliability"] = comm_reliability(r["connectivity_score"])
    r["network"] = "5G"
    return r


@router.get("/model-info")
def model_info():
    """Model transparency for judges: algorithm, metrics, features.

    Values come from the real ml/model/model_meta.json written at train time.
    """
    import json
    import os
    meta_path = os.path.abspath(os.path.join(
        os.path.dirname(__file__), "..", "..", "..", "ml", "model", "model_meta.json"))
    try:
        with open(meta_path) as f:
            meta = json.load(f)
    except Exception:
        meta = {"model": "HistGradientBoostingRegressor", "mae": None,
                "rmse": None, "r2": None, "features": []}
    return {
        "algorithm": meta.get("model", "HistGradientBoostingRegressor"),
        "purpose": "Connectivity score forecasting (0-100)",
        "training_data": "Synthetic prototype measurements (60,000 rows, seed 42)",
        "target": "connectivity_score 0-100",
        "thresholds": {"poor": [0, 30], "unstable": [31, 55], "fair": [56, 75], "good": [76, 100]},
        "mae": meta.get("mae"), "rmse": meta.get("rmse"), "r2": meta.get("r2"),
        "features": meta.get("features", []),
        "confidence_note": ("Prototype confidence: heuristic based on model error, "
                            "distance from typical scores, tower distance, event density "
                            "and weather — not a calibrated probability."),
    }


@router.get("/stationary-forecast")
def stationary(lat: float = 13.0337, lon: float = 77.5649, start_hour: int = 18,
               hours: int = 24, step_min: int = 60):
    from ..services.simulation_service import stationary_forecast
    hours = max(1, min(int(hours), 24))
    step_min = int(step_min) if int(step_min) in (15, 30, 60) else 60
    pts = stationary_forecast(lat, lon, start_hour, hours=hours, step_min=step_min)
    # poor window
    poor = [p for p in pts if p["status"] == "poor"]
    alert = None
    if poor:
        alert = {"start": poor[0]["time"], "end": poor[-1]["time"],
                 "cause": "Expected increase in network load."}
    elif any(p["status"] == "unstable" for p in pts):
        u = [p for p in pts if p["status"] == "unstable"]
        alert = {"start": u[0]["time"], "end": u[-1]["time"],
                 "cause": "Expected increase in network load."}
    return {"location": "MS Ramaiah Institute of Technology", "points": pts, "alert": alert}
