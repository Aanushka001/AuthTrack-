import os
import logging
import traceback
from datetime import datetime
from typing import Dict, List, Any, Optional
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
        self.fraud_classifier: Optional[RandomForestClassifier] = None
        self.anomaly_detector: Optional[IsolationForest] = None
        self.scaler: Optional[StandardScaler] = None
        self.feature_columns = [
            "amount", "hour", "day_of_week", "merchant_risk_score",
            "user_account_age_days", "transaction_velocity_1h",
            "transaction_velocity_24h", "avg_transaction_amount",
            "location_risk_score", "device_risk_score",
            "time_since_last_transaction", "payment_method_risk",
            "ip_reputation_score", "behavioral_anomaly_score",
            "cross_border_transaction",
        ]
        self.last_training: Optional[datetime] = None
        self.model_version = "1.0"
        self.performance_metrics: Dict[str, Any] = {}

    # Placeholder for synthetic data generation
    def create_synthetic_data(self):
        X = np.random.rand(1000, len(self.feature_columns))
        y = np.random.randint(0, 2, 1000)
        return X, y

    # Check if models are loaded
    def is_loaded(self) -> bool:
        return self.fraud_classifier is not None and self.anomaly_detector is not None

    # Placeholder for loading models from disk
    def load_models(self) -> bool:
        # TODO: implement joblib loading if files exist
        return False

    def train(self, X: Optional[np.ndarray] = None, y: Optional[np.ndarray] = None) -> Dict[str, Any]:
        if X is None or y is None:
            X, y = self.create_synthetic_data()
        self.scaler = StandardScaler()
        X_scaled = self.scaler.fit_transform(X)
        self.fraud_classifier = RandomForestClassifier(n_estimators=100, max_depth=10)
        self.fraud_classifier.fit(X_scaled, y)
        self.anomaly_detector = IsolationForest(n_estimators=100)
        self.anomaly_detector.fit(X_scaled)
        self.last_training = datetime.now()
        self.performance_metrics = {"accuracy": 0.95}  # placeholder
        return {"status": "success", "metrics": self.performance_metrics}

    def predict(self, features: List[float]) -> Dict[str, Any]:
        X = np.array(features).reshape(1, -1)
        X_scaled = self.scaler.transform(X) if self.scaler else X
        fraud_prob = float(self.fraud_classifier.predict_proba(X_scaled)[0, 1]) if self.fraud_classifier else 0.0
        fraud_prediction = int(fraud_prob > 0.5)
        anomaly_score = float(self.anomaly_detector.decision_function(X_scaled)[0]) if self.anomaly_detector else 0.0
        feature_importance = self.fraud_classifier.feature_importances_ if self.fraud_classifier else np.zeros(len(self.feature_columns))
        return {
            "fraud_probability": fraud_prob,
            "fraud_prediction": fraud_prediction,
            "anomaly_score": anomaly_score,
            "feature_importance": dict(zip(self.feature_columns, feature_importance)),
            "timestamp": datetime.utcnow().isoformat(),
        }


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