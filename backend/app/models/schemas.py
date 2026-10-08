"""Pydantic schemas for API validation."""
from typing import List, Optional
from pydantic import BaseModel, Field


class PredictRequest(BaseModel):
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    hour: int = Field(..., ge=0, le=23)
    day_of_week: int = Field(..., ge=0, le=6)
    speed: float = Field(50, ge=0, le=200)
    tower_distance: float = Field(1.0, ge=0.05, le=10)
    network_load: float = Field(50, ge=0, le=100)
    historical_quality: float = Field(65, ge=0, le=100)
    weather_factor: float = Field(0.95, ge=0.4, le=1.0)
    event_density: float = Field(0.3, ge=0, le=1.0)


class PredictResponse(BaseModel):
    connectivity_score: float
    status: str
    confidence: float
    signal_strength: float
    latency: float
    throughput: float
    explanation: Optional[dict] = None


class RouteForecastRequest(BaseModel):
    origin: str = "Bengaluru"
    destination: str = "Chennai"
    departure_time: str = "18:00"  # HH:MM
    transport_mode: str = "train"  # train | car | bus
    day_of_week: int = 4


class RouteSegment(BaseModel):
    segment: int
    latitude: float
    longitude: float
    place: str
    time: str
    # Canonical route geometry (haversine-accumulated, backend is source of truth)
    distance_from_start_km: float = 0.0
    distance_to_destination_km: float = 0.0
    speed: float
    tower_distance: float
    network_load: float
    historical_quality: float
    weather_factor: float
    event_density: float
    quality_score: float
    status: str
    confidence: float
    signal_strength: float
    latency: float
    throughput: float


class PoorZone(BaseModel):
    start_segment: int
    end_segment: int
    start_time: str
    end_time: str
    duration_min: int
    # Absolute position on route (canonical); distance_km_ahead is filled by /simulate
    distance_from_start_km: float = 0.0
    distance_to_destination_km: float = 0.0
    distance_km_ahead: Optional[float] = None
    cause: str
    confidence: float


class RouteForecastResponse(BaseModel):
    origin: str
    destination: str
    departure_time: str
    transport_mode: str
    total_km: float
    total_min: int
    total_label: str
    good_min: int
    unstable_min: int
    poor_min: int
    fair_min: int = 0
    summary: dict = {}
    route: List[List[float]]  # [lat, lon]
    segments: List[RouteSegment]
    poor_zones: List[PoorZone]
    warnings: List[str]
    recommendations: List[dict]
    fallback: bool = False


class RecommendationRequest(BaseModel):
    score: float
    status: str
    minutes_to_poor: Optional[float] = None
    has_video_call: bool = False
    video_call_in_min: Optional[float] = None


class SimulateRequest(BaseModel):
    origin: str = "Bengaluru"
    destination: str = "Chennai"
    departure_time: str = "18:00"
    transport_mode: str = "train"
    progress: float = Field(..., ge=0, le=1)  # 0..1 along route
