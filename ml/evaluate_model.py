"""Evaluate saved model: prints MAE / RMSE / R2."""
import os
import joblib
import pandas as pd
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

BASE = os.path.dirname(__file__)
DATA_PATH = os.path.join(BASE, "..", "data", "synthetic_measurements.csv")
MODEL_PATH = os.path.join(BASE, "model", "connectivity_model.pkl")

if __name__ == "__main__":
    import sys
    sys.path.insert(0, os.path.join(BASE, "..", "backend", "app", "ml"))
    # reuse feature logic without importing train script (standalone)
    import numpy as np
    df = pd.read_csv(DATA_PATH)
    df["hour_sin"] = np.sin(2 * np.pi * df["hour"] / 24)
    df["hour_cos"] = np.cos(2 * np.pi * df["hour"] / 24)
    df["peak_hour"] = (((df["hour"] >= 8) & (df["hour"] <= 10)) | ((df["hour"] >= 18) & (df["hour"] <= 21))).astype(int)
    df["is_weekend"] = (df["day_of_week"] >= 5).astype(int)
    feats = ["latitude", "longitude", "hour", "day_of_week", "speed", "tower_distance",
             "network_load", "historical_quality", "weather_factor", "event_density",
             "hour_sin", "hour_cos", "peak_hour", "is_weekend"]
    model = joblib.load(MODEL_PATH)
    pred = model.predict(df[feats])
    y = df["connectivity_score"].values
    print(f"MAE:  {mean_absolute_error(y, pred):.3f}")
    print(f"RMSE: {mean_squared_error(y, pred) ** 0.5:.3f}")
    print(f"R2:   {r2_score(y, pred):.4f}")
