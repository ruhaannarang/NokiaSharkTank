from fastapi import APIRouter, HTTPException
from ..models.schemas import (RouteForecastRequest, RouteForecastResponse, SimulateRequest,
                               RecommendationRequest)
from ..services.route_forecast_service import forecast
from ..services.recommendation_service import build_recommendations

router = APIRouter()


@router.post("/route-forecast", response_model=RouteForecastResponse)
def route_forecast(req: RouteForecastRequest):
    try:
        data = forecast(req.origin, req.destination, req.departure_time,
                        req.transport_mode, req.day_of_week)
        return RouteForecastResponse(**data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/simulate")
def simulate(req: SimulateRequest):
    try:
        data = forecast(req.origin, req.destination, req.departure_time, req.transport_mode)
        segs = data["segments"]
        idx = max(0, min(len(segs) - 1, int(req.progress * (len(segs) - 1))))
        cur = segs[idx]
        # next poor zone ahead
        next_poor = None
        for z in data["poor_zones"]:
            if z["end_segment"] >= idx:
                seg_ahead = max(0, z["start_segment"] - idx)
                km_ahead = round(seg_ahead * (data["total_km"] / len(segs)), 1)
                next_poor = {**z, "distance_km_ahead": km_ahead,
                             "segments_ahead": seg_ahead}
                break
        in_poor = cur["status"] == "poor"
        if in_poor:
            phase = "in_poor_zone"
            msg = "Entering predicted poor connectivity zone."
        elif next_poor and next_poor["segments_ahead"] == 0:
            phase = "approaching"
            msg = f"Poor connectivity predicted {next_poor['distance_km_ahead']} km ahead."
        elif next_poor:
            phase = "approaching"
            msg = f"Poor connectivity predicted {next_poor['distance_km_ahead']} km ahead."
        else:
            phase = "recovered" if any(s["status"] == "poor" for s in segs[:idx]) else "good"
            msg = "Connectivity recovered." if phase == "recovered" else "Connectivity looks good."
        recs = build_recommendations(cur["quality_score"], cur["status"],
                                     minutes_to_poor=(next_poor["segments_ahead"] * data["total_min"] / len(segs)) if next_poor else None)
        return {"index": idx, "current": cur, "next_poor": next_poor,
                "phase": phase, "message": msg,
                "place": cur["place"], "recommendations": recs,
                "progress": req.progress}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/recommendations")
def recommendations(req: RecommendationRequest):
    return {"recommendations": build_recommendations(
        req.score, req.status, req.minutes_to_poor, req.has_video_call, req.video_call_in_min)}


@router.get("/recommendations")
def recommendations_get(score: float = 70, status: str = "good"):
    return {"recommendations": build_recommendations(score, status)}
