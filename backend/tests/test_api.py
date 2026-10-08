"""Basic API + ML tests. Run: python -m pytest backend/tests/test_api.py -v"""
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.services.prediction_service import predict_single
from backend.app.services.recommendation_service import build_recommendations

client = TestClient(app)

GOOD = {"latitude": 12.97, "longitude": 77.59, "hour": 10, "day_of_week": 2,
        "speed": 10, "tower_distance": 0.3, "network_load": 22,
        "historical_quality": 90, "weather_factor": 1.0, "event_density": 0.1}
POOR = {"latitude": 12.12, "longitude": 78.16, "hour": 19, "day_of_week": 4,
        "speed": 65, "tower_distance": 2.8, "network_load": 90,
        "historical_quality": 35, "weather_factor": 0.8, "event_density": 0.7}
MID = {"latitude": 12.52, "longitude": 78.21, "hour": 19, "day_of_week": 4,
       "speed": 60, "tower_distance": 1.5, "network_load": 68,
       "historical_quality": 58, "weather_factor": 0.9, "event_density": 0.45}


def test_health():
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_predict_good():
    r = predict_single(GOOD)
    assert r["connectivity_score"] > 55
    assert r["status"] in ("fair", "good")


def test_predict_poor():
    r = predict_single(POOR)
    assert r["connectivity_score"] < 45
    assert r["status"] in ("poor", "unstable")


def test_predict_endpoint():
    r = client.post("/api/predict", json=MID)
    assert r.status_code == 200
    assert "connectivity_score" in r.json()


def test_route_forecast():
    r = client.post("/api/route-forecast", json={
        "origin": "Bengaluru", "destination": "Chennai",
        "departure_time": "18:00", "transport_mode": "train"})
    assert r.status_code == 200
    d = r.json()
    assert len(d["segments"]) == 60
    assert len(d["poor_zones"]) >= 1
    assert d["total_min"] > 300


def test_simulate():
    r = client.post("/api/simulate", json={
        "origin": "Bengaluru", "destination": "Chennai",
        "departure_time": "18:00", "transport_mode": "train", "progress": 0.45})
    assert r.status_code == 200
    assert "current" in r.json()


def test_stationary():
    r = client.get("/api/stationary-forecast?lat=13.0337&lon=77.5649&start_hour=18")
    assert r.status_code == 200
    assert len(r.json()["points"]) >= 6


def test_recommendations_poor():
    recs = build_recommendations(25, "poor", minutes_to_poor=8)
    assert any("Download" in x["title"] for x in recs)
