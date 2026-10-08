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


@router.get("/stationary-forecast")
def stationary(lat: float = 13.0337, lon: float = 77.5649, start_hour: int = 18):
    from ..services.simulation_service import stationary_forecast
    pts = stationary_forecast(lat, lon, start_hour)
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
