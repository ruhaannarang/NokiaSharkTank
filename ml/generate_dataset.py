"""
Synthetic dataset generator for Predictive Connectivity Intelligence.
Prototype prediction based on simulated/historical network measurements.
NOT real telecom data. Seed fixed for reproducibility.
Route corridor: Bengaluru -> Chennai.
"""
import os
import numpy as np
import pandas as pd

SEED = 42
N_RECORDS = 60000
OUT_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "synthetic_measurements.csv")

rng = np.random.default_rng(SEED)

# Poor-coverage pocket centers (rural / highway gaps / congestion spots)
POOR_POCKETS = [
    (12.72, 77.82, 0.18),   # Hosur rural gap
    (12.52, 78.22, 0.22),   # Krishnagiri stretch
    (12.10, 78.55, 0.20),   # Dharmapuri gap
    (11.75, 78.35, 0.16),   # Salem congestion
    (12.90, 79.35, 0.20),   # Vellore-Ranipet stretch
]

def spatial_penalty(lat, lon):
    pen = np.zeros_like(lat, dtype=float)
    for clat, clon, rad in POOR_POCKETS:
        d = np.sqrt((lat - clat) ** 2 + (lon - clon) ** 2)
        pen += np.exp(-(d ** 2) / (2 * rad ** 2))  # 0..1 gaussian
    return np.clip(pen, 0, 1.2)


def main():
    # Corridor sampling: interpolate Bengaluru(12.9716,77.5946) -> Chennai(13.0827,80.2707)
    # with lateral jitter so data covers the highway belt
    t = rng.uniform(0, 1, N_RECORDS)
    base_lat = 12.9716 + t * (13.0827 - 12.9716) + rng.normal(0, 0.08, N_RECORDS)
    base_lon = 77.5946 + t * (80.2707 - 77.5946) + rng.normal(0, 0.10, N_RECORDS)
    # Add some stationary cluster around MSRIT Bengaluru (13.0337, 77.5649)
    n_stat = N_RECORDS // 6
    idx = rng.choice(N_RECORDS, n_stat, replace=False)
    base_lat[idx] = rng.normal(13.0337, 0.03, n_stat)
    base_lon[idx] = rng.normal(77.5649, 0.03, n_stat)

    hour = rng.integers(0, 24, N_RECORDS)
    day_of_week = rng.integers(0, 7, N_RECORDS)
    speed = np.clip(rng.normal(55, 25, N_RECORDS), 0, 120)

    pocket = spatial_penalty(base_lat, base_lon)

    # Tower distance: worse inside pockets
    tower_distance = np.clip(rng.exponential(0.7, N_RECORDS) + pocket * 1.6, 0.1, 4.5)

    # Peak hours: 8-10, 18-21
    is_peak = ((hour >= 8) & (hour <= 10)) | ((hour >= 18) & (hour <= 21))
    weekend = day_of_week >= 5
    base_load = 25 + is_peak * 28 - weekend * 5 + pocket * 22
    event_density = np.clip(rng.beta(2, 6, N_RECORDS) + is_peak * 0.15 + pocket * 0.15, 0, 1)
    network_load = np.clip(base_load + event_density * 25 + rng.normal(0, 7, N_RECORDS), 5, 99)

    historical_quality = np.clip(
        86 - pocket * 42 - is_peak * 8 + rng.normal(0, 6, N_RECORDS), 10, 98
    )

    weather_choices = rng.choice([1.0, 0.9, 0.78, 0.65], N_RECORDS, p=[0.55, 0.25, 0.13, 0.07])
    weather_factor = weather_choices + rng.normal(0, 0.02, N_RECORDS)
    weather_factor = np.clip(weather_factor, 0.6, 1.0)

    tower_comp = 100 * np.exp(-tower_distance / 1.2)
    load_comp = 100 - network_load
    weather_comp = weather_factor * 100

    score = (
        0.30 * historical_quality
        + 0.28 * load_comp
        + 0.22 * tower_comp
        + 0.10 * weather_comp
        - event_density * 8
        - np.clip(speed - 80, 0, 40) * 0.25
        - (1.0 - weather_factor) * 12
    )
    score = score + rng.normal(0, 3.5, N_RECORDS)
    score = np.clip(score, 4, 98).round(1)

    signal_strength = (-50 - (100 - score) * 0.62 + rng.normal(0, 2, N_RECORDS)).round(1)
    latency = (14 + (100 - score) * 1.75 + rng.normal(0, 6, N_RECORDS)).clip(8, 400).round(1)
    throughput = np.clip((score / 100) ** 2 * 85 + rng.normal(0, 2.5, N_RECORDS), 0.4, 90).round(1)

    def status(s):
        if s <= 30:
            return "poor"
        if s <= 55:
            return "unstable"
        if s <= 75:
            return "fair"
        return "good"

    df = pd.DataFrame({
        "latitude": base_lat.round(5),
        "longitude": base_lon.round(5),
        "hour": hour,
        "day_of_week": day_of_week,
        "speed": speed.round(1),
        "tower_distance": tower_distance.round(2),
        "network_load": network_load.round(1),
        "historical_quality": historical_quality.round(1),
        "weather_factor": weather_factor.round(3),
        "event_density": event_density.round(3),
        "signal_strength": signal_strength,
        "latency": latency,
        "throughput": throughput,
        "connectivity_score": score,
        "connectivity_status": [status(s) for s in score],
    })
    os.makedirs(os.path.dirname(OUT_PATH), exist_ok=True)
    df.to_csv(OUT_PATH, index=False)
    print(f"Wrote {len(df)} rows -> {OUT_PATH}")
    print(df["connectivity_status"].value_counts().to_dict())
    print(df.describe().round(2).to_string())


if __name__ == "__main__":
    main()
