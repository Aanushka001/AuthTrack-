import os
import logging
import traceback
from datetime import datetime
from typing import Dict, List, Any

import numpy as np
import pandas as pd
from flask import Flask, jsonify, request
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_cors import CORS
from sklearn.ensemble import RandomForestClassifier, IsolationForest
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score,
    f1_score, roc_auc_score
)
import joblib


class Config:
    MODEL_PATH = os.getenv("MODEL_PATH", "models/")
    FRAUD_MODEL = os.path.join(MODEL_PATH, "fraud_model.pkl")
    ANOMALY_PATH = os.path.join(MODEL_PATH, "anomaly_model.pkl")
    SCALER_PATH = os.path.join(MODEL_PATH, "scaler.pkl")

    RATE_LIMIT = os.getenv("RATE_LIMIT", "100 per minute")
    PORT = int(os.getenv("ML_SERVICE_PORT", 5001))
    DEBUG = os.getenv("FLASK_ENV", "production") == "development"

    FRAUD_THRESHOLD = 0.5
    ANOMALY_THRESHOLD = -0.1
    MIN_TRAINING_SAMPLES = 1000

    API_KEY = os.getenv("ML_API_KEY", "")
    REQUIRE_AUTH = os.getenv("REQUIRE_AUTH", "false").lower() == "true"


os.makedirs("logs", exist_ok=True)
os.makedirs(Config.MODEL_PATH, exist_ok=True)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.FileHandler("logs/ml_service.log"),
        logging.StreamHandler(),
    ],
)
logger = logging.getLogger("SecureTrace-ML")

app = Flask(__name__)
CORS(
    app,
    origins=["http://localhost:3001", "http://127.0.0.1:3001", "http://localhost:3000"],
    methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)
limiter = Limiter(key_func=get_remote_address, default_limits=[Config.RATE_LIMIT])
limiter.init_app(app)


class FraudDetectionModel:
    def __init__(self):
        self.fraud_classifier = None
        self.anomaly_detector = None
        self.scaler = None
        self.feature_columns = [
            "amount", "hour", "day_of_week", "merchant_risk_score",
            "user_account_age_days", "transaction_velocity_1h",
            "transaction_velocity_24h", "avg_transaction_amount",
            "location_risk_score", "device_risk_score",
            "time_since_last_transaction", "payment_method_risk",
            "ip_reputation_score", "behavioral_anomaly_score",
            "cross_border_transaction",
        ]
        self.last_training = None
        self.model_version = "1.0"
        self.performance_metrics = {}

    def create_synthetic_data(self, n_samples: int = 10000) -> tuple:
        logger.info(f"Generating {n_samples} synthetic training samples...")
        np.random.seed(42)

        data = {
            "amount": np.random.lognormal(mean=3, sigma=2, size=n_samples),
            "hour": np.random.randint(0, 24, n_samples),
            "day_of_week": np.random.randint(0, 7, n_samples),
            "merchant_risk_score": np.random.beta(2, 8, n_samples),
            "user_account_age_days": np.random.exponential(scale=365, size=n_samples),
            "transaction_velocity_1h": np.random.poisson(lam=2, size=n_samples),
            "transaction_velocity_24h": np.random.poisson(lam=10, size=n_samples),
            "avg_transaction_amount": np.random.lognormal(mean=2.5, sigma=1.5, size=n_samples),
            "location_risk_score": np.random.beta(1, 9, n_samples),
            "device_risk_score": np.random.beta(1, 4, n_samples),
            "time_since_last_transaction": np.random.exponential(scale=3600, size=n_samples),
            "payment_method_risk": np.random.choice([0.1, 0.3, 0.5, 0.7], n_samples),
            "ip_reputation_score": np.random.beta(8, 2, n_samples),
            "behavioral_anomaly_score": np.random.beta(1, 9, n_samples),
            "cross_border_transaction": np.random.choice([0, 1], n_samples, p=[0.85, 0.15]),
        }

        df = pd.DataFrame(data)
        fraud_probability = np.minimum(
            0.05
            + 0.3 * (df["amount"] > df["amount"].quantile(0.95))
            + 0.2 * (df["merchant_risk_score"] > 0.7)
            + 0.15 * (df["location_risk_score"] > 0.8)
            + 0.1 * (df["transaction_velocity_1h"] > 5)
            + 0.25 * (df["behavioral_anomaly_score"] > 0.8)
            + 0.1 * df["cross_border_transaction"],
            0.95,
        )

        y = np.random.binomial(1, fraud_probability)
        X = df[self.feature_columns].values
        logger.info(f"Generated {len(X)} samples, {np.sum(y)} fraudulent ({np.mean(y)*100:.1f}%)")
        return X, y

    def train(self, X: np.ndarray = None, y: np.ndarray = None) -> Dict[str, Any]:
        logger.info("Starting model training...")
        try:
            if X is None or y is None:
                X, y = self.create_synthetic_data()

            X_train, X_test, y_train, y_test = train_test_split(
                X, y, test_size=0.2, random_state=42, stratify=y
            )

            self.scaler = StandardScaler()
            X_train_scaled = self.scaler.fit_transform(X_train)
            X_test_scaled = self.scaler.transform(X_test)

            self.fraud_classifier = RandomForestClassifier(
                n_estimators=100, max_depth=10, min_samples_split=5,
                min_samples_leaf=2, random_state=42, class_weight="balanced"
            )
            self.fraud_classifier.fit(X_train_scaled, y_train)

            self.anomaly_detector = IsolationForest(
                contamination=0.1, random_state=42, n_estimators=100
            )
            self.anomaly_detector.fit(X_train_scaled)

            y_pred = self.fraud_classifier.predict(X_test_scaled)
            y_pred_proba = self.fraud_classifier.predict_proba(X_test_scaled)[:, 1]
            anomaly_pred = self.anomaly_detector.predict(X_test_scaled)

            self.performance_metrics = {
                "accuracy": float(accuracy_score(y_test, y_pred)),
                "precision": float(precision_score(y_test, y_pred, zero_division=0)),
                "recall": float(recall_score(y_test, y_pred, zero_division=0)),
                "f1_score": float(f1_score(y_test, y_pred, zero_division=0)),
                "roc_auc": float(roc_auc_score(y_test, y_pred_proba)),
                "fraud_detection_rate": float(np.sum(y_pred[y_test == 1]) / np.sum(y_test)) if np.sum(y_test) > 0 else 0.0,
                "false_positive_rate": float(np.sum(y_pred[y_test == 0]) / np.sum(y_test == 0)) if np.sum(y_test == 0) > 0 else 0.0,
                "anomaly_detection_rate": float(np.sum(anomaly_pred == -1) / len(anomaly_pred)),
                "training_samples": int(len(X_train)),
                "test_samples": int(len(X_test)),
                "fraud_percentage": float(np.mean(y) * 100),
            }

            self._save_models()
            self.last_training = datetime.now()
            logger.info(f"Training complete. Accuracy: {self.performance_metrics['accuracy']:.3f}")

            return {
                "status": "success",
                "metrics": self.performance_metrics,
                "model_version": self.model_version,
                "trained_at": self.last_training.isoformat(),
            }
        except Exception as e:
            logger.error(f"Training failed: {str(e)}\n{traceback.format_exc()}")
            return {"status": "error", "message": str(e)}

    def predict(self, features: List[float]) -> Dict[str, Any]:
        if not self.is_loaded():
            raise ValueError("Models not loaded. Please train first.")

        X = np.array(features).reshape(1, -1)
        if X.shape[1] != len(self.feature_columns):
            raise ValueError(f"Expected {len(self.feature_columns)} features, got {X.shape[1]}")

        X_scaled = self.scaler.transform(X)
        fraud_prob = float(self.fraud_classifier.predict_proba(X_scaled)[0, 1])
        fraud_prediction = int(fraud_prob > Config.FRAUD_THRESHOLD)
        anomaly_score = float(self.anomaly_detector.decision_function(X_scaled)[0])
        anomaly_prediction = int(anomaly_score < Config.ANOMALY_THRESHOLD)

        feature_importance = self.fraud_classifier.feature_importances_
        top_features = sorted(
            zip(self.feature_columns, feature_importance, features),
            key=lambda x: x[1], reverse=True
        )[:5]

        if fraud_prob >= 0.8:
            risk_level = "CRITICAL"
        elif fraud_prob >= 0.6:
            risk_level = "HIGH"
        elif fraud_prob >= 0.4:
            risk_level = "MEDIUM"
        else:
            risk_level = "LOW"

        return {
            "fraud_probability": fraud_prob,
            "fraud_prediction": fraud_prediction,
            "prediction": "fraud" if fraud_prediction == 1 else "legitimate",
            "anomaly_score": anomaly_score,
            "anomaly_prediction": anomaly_prediction,
            "risk_level": risk_level,
            "confidence": float(max(fraud_prob, 1 - fraud_prob)),
            "model_version": self.model_version,
            "timestamp": datetime.utcnow().isoformat(),
            "explanation": {
                "top_risk_factors": [
                    {"feature": f, "importance": float(i), "value": float(v)}
                    for f, i, v in top_features
                ],
                "risk_factors": [f"{f}: {v:.2f}" for f, _, v in top_features[:3]],
                "feature_importance": dict(
                    zip(self.feature_columns, [float(x) for x in feature_importance])
                ),
            },
        }

    def is_loaded(self) -> bool:
        return (
            self.fraud_classifier is not None
            and self.anomaly_detector is not None
            and self.scaler is not None
        )

    def _save_models(self):
        try:
            joblib.dump(self.fraud_classifier, Config.FRAUD_MODEL)
            joblib.dump(self.anomaly_detector, Config.ANOMALY_PATH)
            joblib.dump(self.scaler, Config.SCALER_PATH)
            logger.info("Models saved successfully")
        except Exception as e:
            logger.error(f"Failed to save models: {e}")

    def load_models(self) -> bool:
        try:
            if (
                os.path.exists(Config.FRAUD_MODEL)
                and os.path.exists(Config.ANOMALY_PATH)
                and os.path.exists(Config.SCALER_PATH)
            ):
                self.fraud_classifier = joblib.load(Config.FRAUD_MODEL)
                self.anomaly_detector = joblib.load(Config.ANOMALY_PATH)
                self.scaler = joblib.load(Config.SCALER_PATH)
                logger.info("Models loaded from disk")
                return True
            logger.warning("Model files not found")
            return False
        except Exception as e:
            logger.error(f"Failed to load models: {e}")
            return False


model = FraudDetectionModel()


def authenticate_request() -> bool:
    if not Config.REQUIRE_AUTH:
        return True
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return False
    return auth_header.split(" ")[1] == Config.API_KEY


def ensure_model_loaded() -> bool:
    if model.is_loaded():
        return True
    logger.info("Models not loaded — auto-training...")
    result = model.train()
    return result["status"] == "success"


@app.route("/", methods=["GET"])
def root():
    return jsonify({
        "service": "SecureTrace ML Service",
        "version": model.model_version,
        "status": "running",
        "endpoints": [
            "GET  /health", "POST /train", "POST /predict",
            "POST /analyze", "GET  /model/status", "POST /model/retrain", "POST /retrain",
        ],
    })


@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "healthy",
        "service": "SecureTrace ML Service",
        "version": model.model_version,
        "model_status": "loaded" if model.is_loaded() else "not_loaded",
        "last_training": model.last_training.isoformat() if model.last_training else None,
        "timestamp": datetime.utcnow().isoformat(),
    })


@app.route("/train", methods=["POST"])
@limiter.limit("5 per minute")
def train_model():
    if not authenticate_request():
        return jsonify({"error": "Unauthorized"}), 401
    result = model.train()
    return jsonify(result), 200 if result["status"] == "success" else 500


@app.route("/predict", methods=["POST"])
@limiter.limit("200 per minute")
def predict_fraud():
    if not authenticate_request():
        return jsonify({"error": "Unauthorized"}), 401

    data = request.get_json()
    if not data or "features" not in data:
        return jsonify({"error": "Missing 'features' in request body"}), 400

    features = data["features"]
    if not isinstance(features, list) or len(features) != len(model.feature_columns):
        return jsonify({
            "error": f"Features must be a list of {len(model.feature_columns)} numbers",
            "expected_features": model.feature_columns,
        }), 400

    if not ensure_model_loaded():
        return jsonify({"error": "Failed to load or train models"}), 500

    try:
        result = model.predict(features)
        if not data.get("include_explanation", True):
            result = {k: result[k] for k in ("fraud_probability", "fraud_prediction", "risk_level", "timestamp")}
        return jsonify(result)
    except Exception as e:
        logger.error(f"Prediction failed: {e}")
        return jsonify({"error": "Prediction failed", "message": str(e)}), 500


@app.route("/analyze", methods=["POST"])
@limiter.limit("200 per minute")
def analyze_fraud():
    if not authenticate_request():
        return jsonify({"error": "Unauthorized"}), 401

    data = request.get_json()
    if not data or "features" not in data:
        return jsonify({"error": "Missing 'features' in request body"}), 400

    features = data["features"]
    if not isinstance(features, list) or len(features) != len(model.feature_columns):
        return jsonify({
            "error": f"Features must be a list of {len(model.feature_columns)} numbers",
            "expected_features": model.feature_columns,
        }), 400

    if not ensure_model_loaded():
        return jsonify({"error": "Failed to load or train models"}), 500

    try:
        return jsonify(model.predict(features))
    except Exception as e:
        logger.error(f"Analysis failed: {e}")
        return jsonify({"error": "Analysis failed", "message": str(e)}), 500


@app.route("/model/status", methods=["GET"])
def model_status():
    if not authenticate_request():
        return jsonify({"error": "Unauthorized"}), 401
    return jsonify({
        "model_loaded": model.is_loaded(),
        "model_version": model.model_version,
        "last_training": model.last_training.isoformat() if model.last_training else None,
        "performance_metrics": model.performance_metrics,
        "feature_columns": model.feature_columns,
        "expected_feature_count": len(model.feature_columns),
    })


@app.route("/model/retrain", methods=["POST"])
@app.route("/retrain", methods=["POST"])
@limiter.limit("3 per hour")
def retrain_model():
    if not authenticate_request():
        return jsonify({"error": "Unauthorized"}), 401
    result = model.train()
    return jsonify(result), 200 if result["status"] == "success" else 500


@app.errorhandler(404)
def not_found(_):
    return jsonify({"error": "Endpoint not found"}), 404

@app.errorhandler(500)
def internal_error(_):
    return jsonify({"error": "Internal server error"}), 500

@app.errorhandler(429)
def ratelimit_handler(e):
    return jsonify({"error": "Rate limit exceeded", "message": str(e.description)}), 429


if __name__ == "__main__":
    logger.info("Starting SecureTrace ML Service...")

    if not model.load_models():
        logger.info("No existing models — training on startup...")
        result = model.train()
        if result["status"] == "success":
            logger.info("Initial training complete")
        else:
            logger.error("Initial training failed — will train on first request")

    logger.info(f"Port: {Config.PORT} | Auth required: {Config.REQUIRE_AUTH}")
    app.run(host="0.0.0.0", port=Config.PORT, debug=Config.DEBUG)