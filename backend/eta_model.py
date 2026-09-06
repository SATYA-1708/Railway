"""
RailFlow AI — Dynamic ETA Prediction Engine

Trains a gradient-boosted regression model (scikit-learn when available,
otherwise a numpy weighted-nearest-neighbour fallback) that predicts the
*additional* delay at the train's next station relative to schedule, given
features extracted from the live NTES feed + weather.

Every prediction is reported against a naive persistence baseline
(current delay carried forward unchanged) so the engine shows a measurable
accuracy improvement. Predictions and later-observed actuals are logged by
main.py and scored by /api/metrics/eval.
"""

import math
import os
import re
import json
import pickle
import datetime

FEATURE_NAMES = [
    "baseDelayMin",
    "currentSpeedKmh",
    "remainingStops",
    "stopsRemainingRatio",
    "remainingDistance100km",
    "weatherDelayMin",
    "isNight",
    "isPremium",
    "elapsedRatio",
]

MODEL_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "model")
MODEL_PKL = os.path.join(MODEL_DIR, "eta_model.pkl")
MODEL_META = os.path.join(MODEL_DIR, "eta_model.json")


# ---------------------------------------------------------------------------
# Time / delay helpers (single source of truth, also used by main.py)
# ---------------------------------------------------------------------------

def minutes_of_day(t_str, default=0):
    if not t_str:
        return default
    try:
        if ":" in str(t_str):
            h, m = map(int, str(t_str).strip().split(":")[:2])
            return h * 60 + m
    except (ValueError, TypeError):
        pass
    return default


def format_minutes(total_mins):
    total_mins = int(total_mins) % (24 * 60)
    return f"{total_mins // 60:02d}:{total_mins % 60:02d}"


def add_minutes_to_time(t_str, m_add):
    if not t_str or t_str in ("--", "Source", "Destination", ""):
        return "--"
    return format_minutes(minutes_of_day(t_str) + m_add)


def parse_time_token(t):
    if not t or str(t).strip() in ("--", "Source", "Destination", ""):
        return "--"
    return str(t).strip().split(" ")[0]


def parse_delay_mins(d_str):
    if not d_str or str(d_str).strip().upper() in ("ON TIME", "RIGHT TIME", "RT", "--", ""):
        return 0
    clean = str(d_str).strip()
    if ":" in clean:
        try:
            h, m = map(int, clean.split(":")[:2])
            return h * 60 + m
        except (ValueError, TypeError):
            return 0
    try:
        return int("".join(filter(str.isdigit, clean)))
    except (ValueError, TypeError):
        return 0


def signed_delay_minutes(raw):
    raw = str(raw).strip()
    match = re.search(r"([+-]?\s*)(\d+)", raw, re.IGNORECASE)
    if match and raw:
        val = int(match.group(2))
        if match.group(1).strip() == "-" or "EARLY" in raw.upper() or "BEFORE" in raw.upper():
            return -val
        return val
    return 0


def train_number_parse(raw):
    match = re.fullmatch(r"(\d+)([A-Za-z])?", str(raw).strip())
    if not match:
        return None
    return match.group(1)


def robust_int(value, fallback):
    try:
        return int(float(str(value).replace(",", "").strip()))
    except (ValueError, TypeError):
        return fallback


# ---------------------------------------------------------------------------
# Feature engineering
# ---------------------------------------------------------------------------

def extract_features(fields):
    base_delay = float(fields.get("baseDelayMin", 0) or 0)
    speed = float(fields.get("currentSpeedKmh", 0) or fields.get("currentSpeed", 0) or 0)
    remaining_stops = float(fields.get("remainingStops", 0) or 0)
    total_stops = float(fields.get("totalStops", 1) or 1)
    remaining_km = float(fields.get("remainingDistanceKm", 0) or 0)
    weather = float(fields.get("weatherDelayMin", 0) or 0)
    is_night = 1.0 if fields.get("isNight") else 0.0
    is_premium = 1.0 if fields.get("isPremium") else 0.0
    elapsed = float(fields.get("elapsedRatio", 0) or 0)
    if "stopsRemainingRatio" in fields and fields.get("stopsRemainingRatio") is not None:
        stops_ratio = max(0.0, min(1.0, float(fields["stopsRemainingRatio"])))
    else:
        stops_ratio = remaining_stops / total_stops if total_stops > 0 else 0.0
    return [
        base_delay,
        speed,
        remaining_stops,
        stops_ratio,
        remaining_km / 100.0,
        weather,
        is_night,
        is_premium,
        elapsed,
    ]


# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------

try:
    from sklearn.ensemble import GradientBoostingRegressor  # type: ignore
    from sklearn.model_selection import train_test_split  # type: ignore
    HAS_SKLEARN = True
except ImportError:
    HAS_SKLEARN = False


class WeightedNeighbourETA:
    """Non-parametric fallback: z-score scaled k-NN weighted mean."""

    def __init__(self, k=12):
        self.k = k
        self.X = []
        self.y = []
        self.mean = None
        self.std = None

    def fit(self, X, y, _groups=None):
        import numpy as np

        X = np.asarray(X, dtype=float)
        y = np.asarray(y, dtype=float)
        self.mean = X.mean(axis=0)
        self.std = X.std(axis=0)
        self.std[self.std == 0] = 1.0
        # Cap stored neighbours to bound memory/time on large datasets
        max_rows = 8000
        if len(X) > max_rows:
            idx = np.random.RandomState(7).choice(len(X), max_rows, replace=False)
            X, y = X[idx], y[idx]
        self.X = (X - self.mean) / self.std
        self.y = y

    def predict(self, X):
        import numpy as np

        X = np.asarray(X, dtype=float)
        scaled = (X - self.mean) / self.std
        preds = []
        for row in scaled:
            d2 = ((self.X - row[None, :]) ** 2).sum(axis=1)
            idx = np.argsort(d2)[: self.k]
            w = 1.0 / (np.sqrt(d2[idx]) + 1e-6)
            preds.append(float((w * self.y[idx]).sum() / w.sum()))
        return np.maximum(0, np.asarray(preds, dtype=float))


class ETAModel:
    def __init__(self):
        self.estimator = None
        self.library = "none"
        self.metadata = {}

    def fit(self, X, y):
        import numpy as np

        X = np.asarray(X, dtype=float)
        y = np.asarray(y, dtype=float)
        rows = np.arange(len(y))
        np.random.RandomState(42).shuffle(rows)
        split = int(len(rows) * 0.8)
        train_idx, val_idx = rows[:split], rows[split:]

        if HAS_SKLEARN and len(val_idx) >= 8:
            est = GradientBoostingRegressor(
                n_estimators=180, max_depth=4, learning_rate=0.07,
                subsample=0.85, random_state=42
            )
            est.fit(X[train_idx], y[train_idx])
            self.estimator = est
            self.library = "scikit-learn GradientBoostingRegressor"
        else:
            est = WeightedNeighbourETA(k=min(12, len(train_idx)))
            est.fit(X[train_idx], y[train_idx], None)
            self.estimator = est
            self.library = "numpy WeightedNeighbourETA (fallback)"

        val_pred = self.predict(X[val_idx]).reshape(-1)
        model_mae = float(np.mean(np.abs(val_pred - y[val_idx])))
        baseline_mae = float(np.mean(np.abs(y[val_idx] - y.mean())))
        self.metadata = {
            "samples": int(len(y)),
            "valSamples": int(len(val_idx)),
            "valMaeMin": round(model_mae, 2),
            "valBaselineMaeMin": round(baseline_mae, 2),
            "improvementPct": round(100 * max(0.0, (baseline_mae - model_mae) / (baseline_mae or 1e-9)), 1),
            "library": self.library,
        }

    def predict(self, X):
        import numpy as np

        X = np.asarray(X, dtype=float).reshape(-1, len(FEATURE_NAMES))
        if not hasattr(self.estimator, "predict"):
            return np.zeros(len(X))
        raw = self.estimator.predict(X)
        return np.maximum(0, np.nan_to_num(raw)).reshape(-1)

    def save(self, path=MODEL_PKL):
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "wb") as f:
            pickle.dump({"estimator": self.estimator, "library": self.library}, f)
        with open(MODEL_META, "w", encoding="utf-8") as f:
            json.dump({**self.metadata, "trainedAt": datetime.datetime.now().isoformat(timespec="seconds")}, f, indent=2)

    @classmethod
    def load(cls, path=MODEL_PKL):
        model = cls()
        if not os.path.exists(path):
            return model
        with open(path, "rb") as f:
            payload = pickle.load(f)
        model.estimator = payload.get("estimator")
        model.library = payload.get("library", "unknown")
        if os.path.exists(MODEL_META):
            with open(MODEL_META, "r", encoding="utf-8") as f:
                model.metadata = json.load(f)
        return model


_model_singleton = None


def load_model():
    global _model_singleton
    if _model_singleton is None:
        _model_singleton = ETAModel.load()
    return _model_singleton


def get_loaded_version():
    """Return the trained-at timestamp (or None) so /api/source-status can report the model state."""
    meta = load_model().metadata
    return meta.get("trainedAt") or meta.get("library") or None


def predict_delay(fields):
    """Predict additional delay at the next station (minutes beyond scheduled).

    Returns dict with predicted, baseline persistence delay, improvement and
    the raw features so main.py can surface them to the frontend.
    """
    feats = extract_features(fields)
    model = load_model()
    if not hasattr(model.estimator, "predict"):
        predicted = 0
    else:
        predicted = float(model.predict([feats])[0])
    baseline = float(fields.get("baseDelayMin", 0) or 0)
    return {
        "predictedDelayMin": round(predicted, 1),
        "baselineDelayMin": round(baseline, 1),
        "improvementMin": round(max(0.0, baseline - predicted), 1),
        "modelVersion": model.metadata.get("trainedAt", "untrained"),
        "library": model.library,
        "valMaeMin": model.metadata.get("valMaeMin", None),
        "improvementPct": model.metadata.get("improvementPct", None),
        "features": dict(zip(FEATURE_NAMES, [round(v, 3) for v in feats])),
        "isTrained": bool(getattr(model.estimator, "predict", None)),
    }