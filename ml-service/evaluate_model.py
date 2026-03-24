import joblib
import pickle
import numpy as np
import pandas as pd
from sklearn.metrics import classification_report, confusion_matrix


def load_model_components(model_path: str, scaler_path: str):
    """Load classifier and scaler from disk."""
    with open(model_path, "rb") as f:
        model_data = pickle.load(f)

    if isinstance(model_data, dict):
        classifier = model_data["classifier"]
    else:
        classifier = model_data

    scaler = joblib.load(scaler_path) if scaler_path else None
    return classifier, scaler


def main():
    MODEL_PATH = "models/fraud_model.pkl"
    SCALER_PATH = "models/scaler.pkl"
    DATA_PATH = "data/sample_data.csv"

    classifier, scaler = load_model_components(MODEL_PATH, SCALER_PATH)

    data = pd.read_csv(DATA_PATH)
    X = data.drop("label", axis=1).values
    y = data["label"].values

    if scaler is not None:
        X = scaler.transform(X)

    y_pred = classifier.predict(X)

    print("Classification Report:\n", classification_report(y, y_pred))
    print("Confusion Matrix:\n", confusion_matrix(y, y_pred))


if __name__ == "__main__":
    main()