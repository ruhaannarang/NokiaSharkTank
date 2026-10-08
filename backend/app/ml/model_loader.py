"""Loads trained model once. Falls back to heuristic if missing."""
import os
import joblib

MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "..", "ml", "model", "connectivity_model.pkl")
MODEL_PATH = os.path.abspath(MODEL_PATH)

_model = None
_error = None


def get_model():
    global _model, _error
    if _model is not None:
        return _model
    try:
        if os.path.exists(MODEL_PATH):
            _model = joblib.load(MODEL_PATH)
            return _model
        _error = f"model file not found: {MODEL_PATH}"
        return None
    except Exception as e:  # pragma: no cover
        _error = str(e)
        return None


def model_available() -> bool:
    return get_model() is not None


def model_error() -> str | None:
    get_model()
    return _error
