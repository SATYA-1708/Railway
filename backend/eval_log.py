import json
import os
import threading

LOG_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "logs")
PREDICTION_LOG = os.path.join(LOG_DIR, "prediction_log.jsonl")
PENDING_FILE = os.path.join(LOG_DIR, "pending_predictions.json")

_lock = threading.Lock()


def _ensure_dir():
    if not os.path.isdir(LOG_DIR):
        os.makedirs(LOG_DIR, exist_ok=True)


def _load_pending():
    _ensure_dir()
    if not os.path.isfile(PENDING_FILE):
        return {}
    try:
        with open(PENDING_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
            return data if isinstance(data, dict) else {}
    except Exception:
        return {}


def _save_pending(pending):
    _ensure_dir()
    tmp = PENDING_FILE + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(pending, f, sort_keys=True)
    os.replace(tmp, PENDING_FILE)


def _append_record(rec):
    _ensure_dir()
    with open(PREDICTION_LOG, "a", encoding="utf-8") as f:
        f.write(json.dumps(rec, sort_keys=True) + "\n")


def capture(train_number, journey_date, timeline, predicted_next_delay):
    """Reconcile earlier predictions against observed values and store new pendings.

    - Each station currently marked NEXT near the train registers a pending
      prediction (model + persistence baseline) keyed by train/date/station.
    - Any station now DEPARTED with a pending entry consumes it and appends an
      observed record with error metrics to the ground-truth log.
    - Files are guarded by a thread lock (uvicorn serves multi-threaded).
    """
    with _lock:
        pending = _load_pending()
        for station in timeline:
            code = str(station.get("code") or "").upper()
            if not code:
                continue
            key = f"{train_number}|{journey_date}|{code}"
            observed = int(station.get("delayMin") or 0)
            status = station.get("status", "")
            if status == "NEXT":
                pending[key] = {
                    "predicted": predicted_next_delay if predicted_next_delay is not None else observed,
                    "baseline": observed,
                }
            elif status == "DEPARTED" and key in pending:
                prev = pending.pop(key)
                rec = {
                    "trainNumber": train_number,
                    "journeyDate": journey_date,
                    "stationCode": code,
                    "predictedDelayMin": prev.get("predicted"),
                    "baselineDelayMin": prev.get("baseline"),
                    "observedDelayMin": observed,
                    "absErrorMin": abs(prev.get("predicted", 0) - observed),
                    "baselineAbsErrorMin": abs(prev.get("baseline", 0) - observed),
                }
                _append_record(rec)
        _save_pending(pending)


def read_records(limit=500):
    _ensure_dir()
    if not os.path.isfile(PREDICTION_LOG):
        return []
    rows = []
    try:
        with open(PREDICTION_LOG, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                try:
                    rows.append(json.loads(line))
                except Exception:
                    continue
    except Exception:
        return []
    return rows[-limit:]


def _mean(values):
    values = [float(v) for v in values]
    return sum(values) / len(values) if values else None


def compute_metrics(limit=500):
    """Model MAE/MAPE vs persistence baseline + improvement % from the log."""
    records = read_records(limit=limit)
    if not records:
        return {
            "success": True,
            "observedSamples": 0,
            "message": "No ground-truth observations yet. Each NEXT-station prediction is reconciled as the train departs that station.",
            "modelMaeMin": None,
            "baselineMaeMin": None,
            "improvementPct": None,
        }

    model_errs = [r["absErrorMin"] for r in records]
    base_errs = [r["baselineAbsErrorMin"] for r in records]
    model_mae = _mean(model_errs)
    base_mae = _mean(base_errs)

    mape_vals = []
    for r in records:
        obs = float(r.get("observedDelayMin") or 0)
        if obs == 0:
            continue
        mape_vals.append(abs(float(r.get("predictedDelayMin") or 0) - obs) / abs(obs))
    model_mape = _mean(mape_vals) * 100 if mape_vals else None

    improvement = (base_mae - model_mae) / base_mae * 100 if base_mae else None

    latest = records[-5:]
    return {
        "success": True,
        "observedSamples": len(records),
        "modelMaeMin": round(model_mae, 2) if model_mae is not None else None,
        "baselineMaeMin": round(base_mae, 2) if base_mae is not None else None,
        "improvementPct": round(improvement, 1) if improvement is not None else None,
        "modelMapePct": round(model_mape, 1) if model_mape is not None else None,
        "unit": "minutes",
        "methodology": "Predicted delay at each NEXT station is compared with the observed delay once the train departs that station. Baseline = persistence (observed delay copied forward).",
        "latest": latest,
    }