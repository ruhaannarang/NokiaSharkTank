# ConnectIQ — Predictive Connectivity Intelligence

> **"Don't wait for your network to fail. Know when it will — and act before it does."**
>
> Nokia Shark Tank competition prototype.
> **Prototype prediction based on simulated/historical network measurements — NOT real operator data.**

Traditional coverage maps say *"your coverage here is poor"* (after you suffer).
ConnectIQ says: *"your connectivity will probably become poor 1.4 km ahead at ~7:18 PM for ~8 minutes — download your files now."*

---

## 1. Project overview

AI-powered predictive connectivity assistant — "Google Maps, but for connectivity":

- User selects a route (Bengaluru → Chennai) → system predicts connectivity along the **future** route
- Map shows **GREEN / YELLOW / RED** segments (good / unstable / poor)
- System warns **before** the bad area ("poor predicted 1.4 km ahead, 89% confidence")
- System recommends an action ("download files now", "switch video to audio")
- **Journey simulation**: a marker moves along the route, warnings/distances update live
- Stationary mode (MSRIT), explainability ("why this prediction?"), smart actions, comm reliability

## 2. Problem / Solution

| Today | ConnectIQ |
|---|---|
| Discover poor connectivity after calls drop / video freezes | Predict degradation before it happens |
| Static area coverage maps | Personal route + time forecast |
| No "when / how long / what to do" | Time window + duration + confidence + cause + action |

## 3. Architecture

```
Frontend (React+Vite+Leaflet+Recharts)
   ↓  REST/JSON
FastAPI
   ↓
PredictionService → ML model (HistGradientBoosting, .pkl)
   ↓
RouteForecastService → feature engineering → per-segment ML prediction
   ↓ → RecommendationEngine → Frontend
SyntheticHistoricalData (SQLite-ready, seeded CSV)
```

Real operator data (crowdsourced measurements, KPIs, tower info, load, weather) can replace the synthetic layer later without changing the API contract.

## 4. Tech stack

- Frontend: React 18, Vite 5, Tailwind 3, Leaflet + OpenStreetMap (no key needed), Recharts, lucide-react
- Backend: Python, FastAPI, Pydantic v2, Uvicorn, SQLAlchemy (SQLite file `connectiq.db`)
- ML: pandas, NumPy, scikit-learn (`HistGradientBoostingRegressor`; XGBoost-compatible design, no paid APIs)

## 5. Project structure

```
C:\NokiaSharkTank\
  frontend\  src\{App.jsx, main.jsx, api.js, index.css, components\{RouteMap.jsx, Charts.jsx}}
  backend\app\{main.py, api\{prediction.py, route.py}, services\{prediction_service.py,
             route_forecast_service.py, recommendation_service.py, simulation_service.py},
             ml\{model_loader.py, feature_engineering.py}, models\{schemas.py, database.py}}
  backend\tests\test_api.py
  ml\{generate_dataset.py, train_model.py, evaluate_model.py, model\{connectivity_model.pkl, model_meta.json}}
  data\{synthetic_measurements.csv (60k rows), routes.json}
  README.md
```

## 6. ML methodology

- **Dataset**: `python ml/generate_dataset.py` → 60,000 rows, seed 42, corridor Bengaluru→Chennai + MSRIT cluster, 5 poor-coverage pockets, peak-hour (8–10, 18–21) load, tower-distance decay, weather/event effects.
- **Features**: lat, lon, hour, day_of_week, speed, tower_distance, network_load, historical_quality, weather_factor, event_density + `hour_sin/cos`, `peak_hour`, `is_weekend`.
- **Target**: `connectivity_score` (0–100) → buckets 0–30 poor, 31–55 unstable, 56–75 fair, 76–100 good.
- **Model**: `HistGradientBoostingRegressor(max_iter=350, lr=0.07)` — fast, no XGBoost install risk.
- **Confidence**: transparent prototype heuristic (model MAE + distance-from-typical + tower/event uncertainty), documented as *not* a calibrated probability.
- **Metrics** (test split / full data): MAE ≈ 2.86, RMSE ≈ 3.58, R² ≈ 0.91, status accuracy ≈ 87%.

## 7. API documentation

| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | `{status, model_loaded, mode}` |
| POST | `/api/predict` | Single-point prediction (see spec §20) |
| POST | `/api/route-forecast` | 60-segment forecast + poor zones + warnings + recommendations |
| POST | `/api/simulate` | `{progress 0..1}` → current segment, next poor zone km-ahead, phase, message |
| GET | `/api/stationary-forecast?lat&lon&start_hour` | 3h stationary points + alert window |
| GET | `/api/current-connectivity?lat&lon&hour` | Current score + per-modality reliability + network |
| POST/GET | `/api/recommendations` | Rule-based smart actions |

## 8. Running locally

Prerequisites: Python 3.10+ (tested 3.14), Node 20+ (tested 22).

```powershell
# 1) ML pipeline (one-time; model .pkl already ships, rerun anytime)
python ml/generate_dataset.py
python ml/train_model.py
python ml/evaluate_model.py

# 2) Backend (terminal 1) — from project root
pip install fastapi uvicorn pydantic pandas numpy scikit-learn joblib sqlalchemy httpx pytest
python -m uvicorn backend.app.main:app --port 8000
# open http://localhost:8000/health  and  http://localhost:8000/docs

# 3) Frontend (terminal 2)
cd frontend
npm install
npm run dev     # http://localhost:5173  (proxies /api → :8000)
# production: npm run build ; npm run preview

# 4) Tests
python -m pytest backend/tests/test_api.py -v
```

No API keys required. Map tiles need internet (OSM); if offline, the app falls back to demo data with the warning *"Prediction service unavailable. Showing demonstration forecast."* (fallback forecast is built into the frontend).

## 9. Demo flow (60–90 seconds)

1. `npm run dev` → open app → **Demo Mode** bar.
2. Click **Scenario 1: Bengaluru → Chennai · 6 PM** (or set Origin Bengaluru, Destination Chennai, 18:00, Train → **Predict My Connectivity**).
3. Watch loading checklist → map draws GREEN→YELLOW→**RED**→GREEN; totals ≈ GOOD 2h31m / UNSTABLE 2h01m / POOR 1h30m; alert: *"Poor connectivity predicted N km ahead, confidence ~89%, cause: high load + weak tower coverage."*
4. Click **Start Journey Simulation** → marker moves; banner counts down (*17 km ahead → 1.4 km ahead → Entering poor zone → CURRENT: POOR −108 dBm / 184 ms / 2.1 Mbps → Connectivity recovered*).
5. Check **Smart Actions** (download now / switch video to audio), **Why this prediction?**, **Context**, **Future forecast** chart, **Insights** tab (MAE/RMSE/R²).
6. Try **Stationary** mode + Scenario 2/3.

## 10. Limitations

- All measurements are **synthetic**; route geometry is a straight-line demo corridor (≈512 km via waypoints), not surveyed coverage.
- No real operator/tower/weather/event feeds; no auth, payments, or mobile-native actions (buttons are prototype interactions).
- Confidence is a documented heuristic, not calibrated uncertainty.
- OSM tiles require internet; everything else runs offline.

## 11. Future improvements

Plug in crowdsourced measurements + operator KPIs + tower DB + real load/weather/events; per-user calibration; LSTM/Transformer temporal model; calibrated uncertainty; PostgreSQL/Supabase; push alerts; offline-pack downloads actually triggering; PWA/mobile.
