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


def _forecast():
    r = client.post("/api/route-forecast", json={
        "origin": "Bengaluru", "destination": "Chennai",
        "departure_time": "18:00", "transport_mode": "train"})
    assert r.status_code == 200
    return r.json()


def test_canonical_distances_accumulate():
    d = _forecast()
    segs = d["segments"]
    assert segs[0]["distance_from_start_km"] == 0.0
    # distances strictly increase and sum to total
    for a, b in zip(segs, segs[1:]):
        assert b["distance_from_start_km"] > a["distance_from_start_km"]
        assert abs((b["distance_from_start_km"] + b["distance_to_destination_km"]) - d["total_km"]) < 0.2
    assert abs(segs[-1]["distance_from_start_km"] - d["total_km"]) < 2.0
    assert segs[-1]["distance_to_destination_km"] == 0.0


def test_summary_matches_parts():
    d = _forecast()
    s = d["summary"]
    assert s["good_min"] == d["good_min"]
    assert s["poor_min"] == d["poor_min"]
    assert s["unstable_min"] == d["unstable_min"]


def test_poor_zone_has_canonical_position():
    d = _forecast()
    assert len(d["poor_zones"]) >= 1
    z = d["poor_zones"][0]
    seg = d["segments"][z["start_segment"]]
    assert z["distance_from_start_km"] == seg["distance_from_start_km"]
    assert z["duration_min"] >= 2


def test_simulate_distance_ahead_is_canonical():
    d = _forecast()
    z = d["poor_zones"][0]
    # progress just before the poor zone
    frac = max(0.0, (z["start_segment"] - 2) / (len(d["segments"]) - 1))
    r = client.post("/api/simulate", json={
        "origin": "Bengaluru", "destination": "Chennai",
        "departure_time": "18:00", "transport_mode": "train", "progress": frac})
    assert r.status_code == 200
    body = r.json()
    cur = body["current"]
    expected = round(max(0.0, z["distance_from_start_km"] - cur["distance_from_start_km"]), 1)
    assert body["next_poor"]["distance_km_ahead"] == expected


def test_simulate_progression():
    msgs = set()
    for p in (0.0, 0.5, 1.0):
        r = client.post("/api/simulate", json={
            "origin": "Bengaluru", "destination": "Chennai",
            "departure_time": "18:00", "transport_mode": "train", "progress": p})
        assert r.status_code == 200
        msgs.add(r.json()["phase"])
    assert msgs  # phases vary across the journey


def test_invalid_transport_and_time_normalized():
    r = client.post("/api/route-forecast", json={
        "origin": "Bengaluru", "destination": "Chennai",
        "departure_time": "not-a-time", "transport_mode": "spaceship"})
    assert r.status_code == 200
    assert r.json()["transport_mode"] == "train"
    assert r.json()["departure_time"] == "18:00"


def test_model_info_matches_train_meta():
    import json
    import os
    r = client.get("/api/model-info")
    assert r.status_code == 200
    body = r.json()
    with open(os.path.join("ml", "model", "model_meta.json")) as f:
        meta = json.load(f)
    assert body["algorithm"] == meta["model"]
    assert body["r2"] == meta["r2"]
    assert body["mae"] == meta["mae"]
    assert "hour_sin" in body["features"]
