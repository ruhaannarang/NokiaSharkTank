"""
Train connectivity_score regressor.
Uses HistGradientBoostingRegressor (fast, no XGBoost dependency).
Saves model + metrics + feature columns.
"""
import json
import os
import numpy as np
import pandas as pd
import joblib
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.ensemble import HistGradientBoostingRegressor

DATA_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "synthetic_measurements.csv")
MODEL_DIR = os.path.join(os.path.dirname(__file__), "model")
MODEL_PATH = os.path.join(MODEL_DIR, "connectivity_model.pkl")
META_PATH = os.path.join(MODEL_DIR, "model_meta.json")

FEATURES = [
    "latitude", "longitude", "hour", "day_of_week", "speed",
    "tower_distance", "network_load", "historical_quality",
    "weather_factor", "event_density",
    "hour_sin", "hour_cos", "peak_hour", "is_weekend",
]


def add_features(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df["hour_sin"] = np.sin(2 * np.pi * df["hour"] / 24)
    df["hour_cos"] = np.cos(2 * np.pi * df["hour"] / 24)
    df["peak_hour"] = (((df["hour"] >= 8) & (df["hour"] <= 10)) | ((df["hour"] >= 18) & (df["hour"] <= 21))).astype(int)
    df["is_weekend"] = (df["day_of_week"] >= 5).astype(int)
    return df


def score_to_status(s: float) -> str:
    if s <= 30:
        return "poor"
    if s <= 55:
        return "unstable"
    if s <= 75:
        return "fair"
    return "good"


def main():
    df = pd.read_csv(DATA_PATH)
    df = add_features(df)
    X = df[FEATURES]
    y = df["connectivity_score"]
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    model = HistGradientBoostingRegressor(
        max_iter=350, learning_rate=0.07, max_leaf_nodes=63,
        min_samples_leaf=25, l2_regularization=1.0, random_state=42,
    )
    model.fit(X_train, y_train)
    pred = model.predict(X_test)
    mae = float(mean_absolute_error(y_test, pred))
    rmse = float(mean_squared_error(y_test, pred) ** 0.5)
    r2 = float(r2_score(y_test, pred))

    os.makedirs(MODEL_DIR, exist_ok=True)
    joblib.dump(model, MODEL_PATH)
    with open(META_PATH, "w") as f:
        json.dump({"features": FEATURES, "mae": mae, "rmse": rmse, "r2": r2,
                   "model": "HistGradientBoostingRegressor"}, f, indent=2)
    print(f"Saved model -> {MODEL_PATH}")
    print(f"MAE:  {mae:.3f}")
    print(f"RMSE: {rmse:.3f}")
    print(f"R2:   {r2:.4f}")

    # Classification accuracy on status buckets (informational)
    pred_status = [score_to_status(s) for s in pred]
    true_status = [score_to_status(s) for s in y_test.values]
    acc = float(np.mean([a == b for a, b in zip(pred_status, true_status)]))
    print(f"Status accuracy: {acc:.4f}")


if __name__ == "__main__":
    main()
