"""ConnectIQ FastAPI backend."""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api.prediction import router as prediction_router
from .api.route import router as route_router
from .models.database import init_db
from .ml.model_loader import model_available, model_error


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        init_db()
    except Exception as e:
        print("DB init warning:", e)
    yield


app = FastAPI(title="ConnectIQ — Predictive Connectivity Intelligence",
              description="Prototype prediction based on simulated/historical network measurements.",
              version="0.1.0",
              lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_credentials=True,
    allow_methods=["*"], allow_headers=["*"],
)

app.include_router(prediction_router, prefix="/api", tags=["prediction"])
app.include_router(route_router, prefix="/api", tags=["route"])


@app.get("/health")
def health():
    ml = model_available()
    return {"status": "ok", "model_loaded": ml,
            "model_error": None if ml else model_error(),
            "mode": "prototype-synthetic-data"}
