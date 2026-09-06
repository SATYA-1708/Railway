# RailFlow AI — PS 26028 (SIH 2026)

**Dynamic Forecast of ETA for Coaching Trains** — a feature-complete demo running 100% on a local PC (no cloud deployment).

RailFlow AI fuses the official **Indian Railways NTES live feed**, **Open-Meteo satellite weather**, and a **trained gradient-boosted ETA model** to forecast arrival times, explain delays in plain language, and let controllers simulate platform changes before acting.

```
┌─────────────────────────┐        ┌────────────────────────────────────────────┐
│  React 19 + Vite +      │  HTTP  │  FastAPI (uvicorn, localhost:8000)         │
│  Tailwind CSS v4        │ ─────► │  /api/live-ntes-train/{num}                │
│  (passenger + staff     │        │  /api/predict  /api/metrics/eval            │
│   portal, signalling    │        │  /api/model/card  /api/source-status        │
│   VDU, what-if sandbox) │        │  /api/what-if  /api/simulate                │
└─────────────────────────┘        └────────────────────────────────────────────┘
                                          │
                    ┌─────────────────────┼─────────────────────────┐
                    ▼                     ▼                         ▼
            NTES live status      Open-Meteo weather       ETA model (sklearn GBM)
            + schedule + roster  (fog / visibility)       backend/model/eta_model.pkl
                    │                                       backend/logs/prediction_log.jsonl
                    └──────────  ground-truth reconciliation ──────────┘
```

## Features

- **Passenger portal** — search any NTES train, live position + next-arrival ETA window, station-by-station timeline (BOARDING → NEXT → DEPARTED → UPCOMING), plain-language delay reasons, weather at the train, journey saving, alerts, 45-second auto-refresh (toggleable).
- **Staff portal** — operator login (demo), multi-corridor fleet map, operations dashboard, platform alerts, track & traffic awareness, signalling VDU (BPL / BZA / NDLS electronic-interlocking ladder with signals, points, track circuits, NX route setting), what-if platform-reassignment sandbox with honest impact math.
- **AI prediction engine** — gradient-boosted regression over NTES telemetry + weather + timetable features. Every forecast is shown **against a persistence baseline** so improvement is always measurable, never self-claimed.
- **Honest data policy** — every payload is labelled `dataSource: LIVE` or `SIMULATED`; when the NTES feed is unreachable the app transparently serves a clearly-badged offline simulation built from the real static roster, so the demo never silently fakes live data.

## Run locally

### 1. Backend (Python 3.10+)

```bash
cd backend
python -m venv .venv && .venv\Scripts\activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python -m unittest test_eta_model                     # 12 tests
python main.py                                        # serves http://localhost:8000
```

Optional environment variables:

| Variable | Default | Meaning |
| --- | --- | --- |
| `HOST` | `0.0.0.0` | uvicorn bind host |
| `PORT` | `8000` | uvicorn bind port |
| `ALLOWED_ORIGINS` | `http://localhost:5173,http://127.0.0.1:5173` | CORS allow-list |
| `VITE_API_BASE_URL` *(frontend `.env`)* | `http://localhost:8000` | backend base URL |

### 2. Frontend (Node 18+/20)

```bash
cd frontend
npm install
npm run lint      # oxlint — zero warnings expected
npm run dev       # serves http://localhost:5173
```

### 3. Re-train the ETA model (optional)

```bash
cd backend
python train_eta_model.py   # writes backend/model/eta_model.pkl + eta_model.json
```

## API endpoints

| Endpoint | Purpose |
| --- | --- |
| `GET /` | service banner |
| `GET /api/live-ntes-train/{train_number}?journey_date=` | full live response (timeline, weather, predictionEngine, dataSource) |
| `GET /api/predict?train_number=` | focused forecast + features vs baseline |
| `GET /api/metrics/eval?limit=` | online ground-truth evaluation (model MAE vs baseline MAE) |
| `GET /api/model/card` | trained-model card (library, held-out validation, provenance) |
| `GET /api/source-status` | health + honesty of every data feed |
| `GET /api/trains-between?from_station=&to_station=` | trains between two stations |
| `POST /api/simulate` | scenario delay simulator |
| `POST /api/what-if` | platform-reassignment sandbox (impact math documented in response) |

## Model, data sources & honest limitations

- **NTES (National Train Enquiry System)** — live running status & schedule. When unreachable the app falls back to a clearly-badged `SIMULATED` mode using the real static roster + live weather.
- **Open-Meteo** — satellite weather (visibility / fog / rain) at the train's coordinates.
- **ETA model** — scikit-learn `GradientBoostingRegressor` (n_estimators=180, depth=4, lr=0.07, subsample=0.85) trained on synthetic baseline data for demo parity. Held-out validation currently reports ~0.02 min MAE vs 2.61 min baseline on that synthetic set. The model card (`/api/model/card`) states this provenance explicitly. Continuous retraining on captured NTES ground truth (`/api/metrics/eval`) replaces synthetic patterns with real learned delay-recovery behaviour over time.
- **Ground-truth loop** — every NEXT-station forecast is stored in `backend/logs/` and reconciled with the observed delay when the train departs that station; the Analytics panel reports honest model-vs-baseline error.

### Known limitations (stated honestly, not hidden)

- The demo model is initially trained on synthetic annotations; real NTES observations accumulate into `prediction_log.jsonl` for retraining.
- What-if passenger-minutes use an operator-supplied `passengerLoadEstimate` multiplier (see `impactMethodology` in the response), not live passenger telemetry.
- Prediction confidence widens early in the journey, where telemetry is sparse.
- Cloud deployment is intentionally out of scope for this build-out — everything runs on the local PC.

## Demo script (5 minutes)

1. `cd backend && python main.py` and `cd frontend && npm run dev`.
2. Search a 4/5-digit train number in the **Passenger** tab — note the `● LIVE — NTES Feed` badge, ETA window, plain-language delay reason, and the AI prediction engine vs baseline card.
3. Turn on **Auto** refresh and watch the position update every 45 s.
4. Search a number WITHOUT a live feed periodically → watch the badge flip to `● SIMULATED — Offline Demo` (honest labeling).
5. **Staff** tab → **Analytics** → Prediction Accuracy panel (model vs baseline from `/api/metrics/eval`).
6. **Staff** tab → **Signalling** → click platforms to toggle occupancy and set NX routes on the BPL/BZA/NDLS VDU.
7. **Staff** tab → **Platform Alerts → What-If** → reassign a platform, note the documented passenger-minutes impact.

## Folder map

```
backend/
  main.py                  FastAPI app (live NTES + fallback, what-if, eval endpoints)
  weather.py               IST + Open-Meteo weather (shared by main & simulator)
  stations_data.py         station coordinates / code resolution
  eta_model.py             prediction engine + time/delay helpers (single source of truth)
  train_eta_model.py       training script
  historical_eta_data.py   synthetic baseline dataset generator
  simulator.py             SIMULATED offline fallback (same schema, honestly badged)
  eval_log.py              ground-truth capture + online metrics
  model/                   eta_model.pkl + eta_model.json (trained artifact)
  logs/                    ground-truth prediction log (created at runtime)
  test_eta_model.py        stdlib unittest suite
frontend/
  src/components/          passenger + staff views, signalling VDU, what-if sandbox
  src/services/            liveRailwayService, liveWeatherService
  src/data/                static roster + generated offline database
```