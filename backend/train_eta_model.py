"""
RailFlow AI — Model training entrypoint

    python train_eta_model.py

Trains the ETA model on the historical baseline dataset, evaluates against a
held-out 20% split (MAE vs the persistence baseline) and persists the model to
backend/model/eta_model.pkl + eta_model.json (used at API runtime).
"""

import os
import json
import numpy as np

import eta_model
import historical_eta_data

HERE = os.path.dirname(os.path.abspath(__file__))
DATASET = os.path.join(HERE, "historical_eta_baseline.json")


def main():
    if not os.path.exists(DATASET):
        historical_eta_data.generate_records(out_path=DATASET)

    with open(DATASET, "r", encoding="utf-8") as f:
        data = json.load(f)

    features, labels = [], []
    for rec in data["records"]:
        features.append([rec["features"][name] for name in eta_model.FEATURE_NAMES])
        labels.append(rec["label"])

    X = np.asarray(features, dtype=float)
    y = np.asarray(labels, dtype=float)

    model = eta_model.ETAModel()
    model.fit(X, y)
    model.save()
    print(f"Trained on {len(y)} samples | library={model.library}")
    print(json.dumps(model.metadata, indent=2))
    print("Model persisted to", eta_model.MODEL_PKL)


if __name__ == "__main__":
    main()