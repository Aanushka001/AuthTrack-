
# # C:\Users\aanus\Downloads\AutheTrack\AutheTrack\ml-service\app.py


# import os
# import logging
# import pickle
# import traceback
# from datetime import datetime, timedelta
# from typing import Dict, List, Any, Optional

# import numpy as np
# import pandas as pd
# from flask import Flask, jsonify, request
# from flask_limiter import Limiter
# from flask_limiter.util import get_remote_address
# from flask_cors import CORS
# from sklearn.ensemble import RandomForestClassifier, IsolationForest
# from sklearn.model_selection import train_test_split
# from sklearn.preprocessing import StandardScaler, LabelEncoder
# from sklearn.metrics import (
#     accuracy_score, precision_score, recall_score,
#     f1_score, roc_auc_score, classification_report
# )
# from sklearn.compose import ColumnTransformer
# from sklearn.pipeline import Pipeline
# import joblib

# # ================= CONFIGURATION =================
# class Config:
#     MODEL_PATH = "models/fraud_model.pkl"
#     ANOMALY_PATH = "models/anomaly_model.pkl"
#     SCALER_PATH = "models/scaler.pkl"
#     RATE_LIMIT = "100 per minute"
#     PORT = 5001
#     DEBUG = True
    
#     # Model parameters
#     FRAUD_THRESHOLD = 0.5
#     ANOMALY_THRESHOLD = -0.1
#     MIN_TRAINING_SAMPLES = 1000
#     RETRAIN_INTERVAL_HOURS = 24
    
#     # API Key for authentication (Optional - can be disabled for development)
#     API_KEY = os.getenv("ML_API_KEY", "89a6f454a6455c2a9cc85cee4eda59fe61599c632996e8d23300b63ae3efd97d")
#     REQUIRE_AUTH = os.getenv("REQUIRE_AUTH", "false").lower() == "true"

# # ================= LOGGING SETUP =================
# os.makedirs("logs", exist_ok=True)
# os.makedirs("models", exist_ok=True)

# logging.basicConfig(
#     level=logging.INFO,
#     format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
#     handlers=[
#         logging.FileHandler("logs/ml_service.log"),
#         logging.StreamHandler()
#     ]
# )
# logger = logging.getLogger("SecureTrace-ML")

# # ================= FLASK APP SETUP =================
# app = Flask(__name__)

# # Configure CORS properly
# CORS(app, origins=["http://localhost:3001", "http://127.0.0.1:3001", "http://localhost:3000"], 
#      methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
#      allow_headers=['Content-Type', 'Authorization'])

# limiter = Limiter(key_func=get_remote_address, default_limits=[Config.RATE_LIMIT])
# limiter.init_app(app)

# # ================= ML MODEL CLASS =================
# class FraudDetectionModel:
#     def __init__(self):
#         self.fraud_classifier = None
#         self.anomaly_detector = None
#         self.scaler = None
#         self.feature_columns = [
#             'amount', 'hour', 'day_of_week', 'merchant_risk_score',
#             'user_account_age_days', 'transaction_velocity_1h',
#             'transaction_velocity_24h', 'avg_transaction_amount',
#             'location_risk_score', 'device_risk_score',
#             'time_since_last_transaction', 'payment_method_risk',
#             'ip_reputation_score', 'behavioral_anomaly_score',
#             'cross_border_transaction'
#         ]
#         self.last_training = None
#         self.model_version = "1.0"
#         self.performance_metrics = {}
        
#     def create_synthetic_data(self, n_samples: int = 10000) -> tuple:
#         """Create realistic synthetic fraud detection dataset"""
#         logger.info(f"Generating {n_samples} synthetic training samples...")
        
#         np.random.seed(42)
        
#         # Generate realistic transaction features
#         data = {
#             'amount': np.random.lognormal(mean=3, sigma=2, size=n_samples),
#             'hour': np.random.randint(0, 24, n_samples),
#             'day_of_week': np.random.randint(0, 7, n_samples),
#             'merchant_risk_score': np.random.beta(2, 8, n_samples),
#             'user_account_age_days': np.random.exponential(scale=365, size=n_samples),
#             'transaction_velocity_1h': np.random.poisson(lam=2, size=n_samples),
#             'transaction_velocity_24h': np.random.poisson(lam=10, size=n_samples),
#             'avg_transaction_amount': np.random.lognormal(mean=2.5, sigma=1.5, size=n_samples),
#             'location_risk_score': np.random.beta(1, 9, n_samples),
#             'device_risk_score': np.random.beta(1, 4, n_samples),
#             'time_since_last_transaction': np.random.exponential(scale=3600, size=n_samples),
#             'payment_method_risk': np.random.choice([0.1, 0.3, 0.5, 0.7], n_samples),
#             'ip_reputation_score': np.random.beta(8, 2, n_samples),
#             'behavioral_anomaly_score': np.random.beta(1, 9, n_samples),
#             'cross_border_transaction': np.random.choice([0, 1], n_samples, p=[0.85, 0.15])
#         }
        
#         df = pd.DataFrame(data)
        
#         # Generate fraud labels with realistic patterns
#         fraud_probability = (
#             0.05 +  # Base fraud rate
#             0.3 * (df['amount'] > df['amount'].quantile(0.95)) +
#             0.2 * (df['merchant_risk_score'] > 0.7) +
#             0.15 * (df['location_risk_score'] > 0.8) +
#             0.1 * (df['transaction_velocity_1h'] > 5) +
#             0.25 * (df['behavioral_anomaly_score'] > 0.8) +
#             0.1 * df['cross_border_transaction']
#         )
        
#         fraud_probability = np.minimum(fraud_probability, 0.95)
#         fraud_labels = np.random.binomial(1, fraud_probability)
        
#         X = df[self.feature_columns].values
#         y = fraud_labels
        
#         logger.info(f"Generated dataset: {len(X)} samples, {np.sum(y)} fraudulent ({np.mean(y)*100:.1f}%)")
#         return X, y
    
#     def train(self, X: np.ndarray = None, y: np.ndarray = None) -> Dict[str, Any]:
#         """Train the fraud detection models"""
#         logger.info("Starting model training...")
        
#         try:
#             if X is None or y is None:
#                 X, y = self.create_synthetic_data()
            
#             X_train, X_test, y_train, y_test = train_test_split(
#                 X, y, test_size=0.2, random_state=42, stratify=y
#             )
            
#             self.scaler = StandardScaler()
#             X_train_scaled = self.scaler.fit_transform(X_train)
#             X_test_scaled = self.scaler.transform(X_test)
            
#             self.fraud_classifier = RandomForestClassifier(
#                 n_estimators=100,
#                 max_depth=10,
#                 min_samples_split=5,
#                 min_samples_leaf=2,
#                 random_state=42,
#                 class_weight='balanced'
#             )
#             self.fraud_classifier.fit(X_train_scaled, y_train)
            
#             self.anomaly_detector = IsolationForest(
#                 contamination=0.1,
#                 random_state=42,
#                 n_estimators=100
#             )
#             self.anomaly_detector.fit(X_train_scaled)
            
#             y_pred = self.fraud_classifier.predict(X_test_scaled)
#             y_pred_proba = self.fraud_classifier.predict_proba(X_test_scaled)[:, 1]
#             anomaly_pred = self.anomaly_detector.predict(X_test_scaled)
            
#             self.performance_metrics = {
#                 "accuracy": float(accuracy_score(y_test, y_pred)),
#                 "precision": float(precision_score(y_test, y_pred, zero_division=0)),
#                 "recall": float(recall_score(y_test, y_pred, zero_division=0)),
#                 "f1_score": float(f1_score(y_test, y_pred, zero_division=0)),
#                 "roc_auc": float(roc_auc_score(y_test, y_pred_proba)),
#                 "fraud_detection_rate": float(np.sum(y_pred[y_test == 1]) / np.sum(y_test)) if np.sum(y_test) > 0 else 0.0,
#                 "false_positive_rate": float(np.sum(y_pred[y_test == 0]) / np.sum(y_test == 0)) if np.sum(y_test == 0) > 0 else 0.0,
#                 "anomaly_detection_rate": float(np.sum(anomaly_pred == -1) / len(anomaly_pred)),
#                 "training_samples": int(len(X_train)),
#                 "test_samples": int(len(X_test)),
#                 "fraud_percentage": float(np.mean(y) * 100)
#             }
            
#             self._save_models()
#             self.last_training = datetime.now()
            
#             logger.info(f"Training completed successfully! Accuracy: {self.performance_metrics['accuracy']:.3f}")
#             return {
#                 "status": "success",
#                 "metrics": self.performance_metrics,
#                 "model_version": self.model_version,
#                 "trained_at": self.last_training.isoformat()
#             }
            
#         except Exception as e:
#             logger.error(f"Training failed: {str(e)}")
#             logger.error(traceback.format_exc())
#             return {"status": "error", "message": str(e)}
    
#     def predict(self, features: List[float]) -> Dict[str, Any]:
#         """Predict fraud probability and anomaly score"""
#         try:
#             if not self.is_loaded():
#                 raise ValueError("Models not loaded. Please train first.")
            
#             X = np.array(features).reshape(1, -1)
            
#             if X.shape[1] != len(self.feature_columns):
#                 raise ValueError(f"Expected {len(self.feature_columns)} features, got {X.shape[1]}")
            
#             X_scaled = self.scaler.transform(X)
            
#             fraud_prob = float(self.fraud_classifier.predict_proba(X_scaled)[0, 1])
#             fraud_prediction = int(fraud_prob > Config.FRAUD_THRESHOLD)
#             anomaly_score = float(self.anomaly_detector.decision_function(X_scaled)[0])
#             anomaly_prediction = int(anomaly_score < Config.ANOMALY_THRESHOLD)
            
#             feature_importance = self.fraud_classifier.feature_importances_
#             top_features = sorted(
#                 zip(self.feature_columns, feature_importance, features),
#                 key=lambda x: x[1], reverse=True
#             )[:5]
            
#             if fraud_prob >= 0.8:
#                 risk_level = "CRITICAL"
#             elif fraud_prob >= 0.6:
#                 risk_level = "HIGH"
#             elif fraud_prob >= 0.4:
#                 risk_level = "MEDIUM"
#             else:
#                 risk_level = "LOW"
            
#             result = {
#                 "fraud_probability": fraud_prob,
#                 "fraud_prediction": fraud_prediction,
#                 "anomaly_score": anomaly_score,
#                 "anomaly_prediction": anomaly_prediction,
#                 "risk_level": risk_level,
#                 "confidence": float(max(fraud_prob, 1 - fraud_prob)),
#                 "model_version": self.model_version,
#                 "timestamp": datetime.utcnow().isoformat(),
#                 "explanation": {
#                     "top_risk_factors": [
#                         {
#                             "feature": feature,
#                             "importance": float(importance),
#                             "value": float(value)
#                         }
#                         for feature, importance, value in top_features
#                     ],
#                     "decision_rationale": self._generate_explanation(fraud_prob, top_features)
#                 }
#             }
            
#             return result
            
#         except Exception as e:
#             logger.error(f"Prediction failed: {str(e)}")
#             raise e
    
#     def _generate_explanation(self, fraud_prob: float, top_features: list) -> str:
#         """Generate human-readable explanation for the prediction"""
#         if fraud_prob > 0.7:
#             explanation = f"HIGH RISK transaction ({fraud_prob*100:.1f}% fraud probability). "
#         elif fraud_prob > 0.5:
#             explanation = f"MODERATE RISK transaction ({fraud_prob*100:.1f}% fraud probability). "
#         else:
#             explanation = f"LOW RISK transaction ({fraud_prob*100:.1f}% fraud probability). "
        
#         top_factor = top_features[0]
#         explanation += f"Primary concern: {top_factor[0]} (value: {top_factor[2]:.2f}). "
        
#         if len(top_features) > 1:
#             explanation += f"Secondary factors: {', '.join([f[0] for f in top_features[1:3]])}."
        
#         return explanation
    
#     def is_loaded(self) -> bool:
#         """Check if models are loaded and ready"""
#         return (self.fraud_classifier is not None and 
#                 self.anomaly_detector is not None and 
#                 self.scaler is not None)
    
#     def _save_models(self):
#         """Save trained models to disk"""
#         try:
#             joblib.dump(self.fraud_classifier, Config.MODEL_PATH)
#             joblib.dump(self.anomaly_detector, Config.ANOMALY_PATH)
#             joblib.dump(self.scaler, Config.SCALER_PATH)
#             logger.info("Models saved successfully")
#         except Exception as e:
#             logger.error(f"Failed to save models: {str(e)}")
    
#     def load_models(self) -> bool:
#         """Load models from disk"""
#         try:
#             if (os.path.exists(Config.MODEL_PATH) and 
#                 os.path.exists(Config.ANOMALY_PATH) and 
#                 os.path.exists(Config.SCALER_PATH)):
                
#                 self.fraud_classifier = joblib.load(Config.MODEL_PATH)
#                 self.anomaly_detector = joblib.load(Config.ANOMALY_PATH)
#                 self.scaler = joblib.load(Config.SCALER_PATH)
#                 logger.info("Models loaded successfully")
#                 return True
#             else:
#                 logger.warning("Model files not found")
#                 return False
#         except Exception as e:
#             logger.error(f"Failed to load models: {str(e)}")
#             return False

# # ================= GLOBAL MODEL INSTANCE =================
# model = FraudDetectionModel()

# # ================= MIDDLEWARE =================
# def authenticate_request():
#     """Verify API key (optional for development)"""
#     if not Config.REQUIRE_AUTH:
#         return True
        
#     auth_header = request.headers.get('Authorization')
#     if not auth_header or not auth_header.startswith('Bearer '):
#         return False
    
#     token = auth_header.split(' ')[1]
#     return token == Config.API_KEY

# # ================= API ROUTES =================
# @app.route("/health", methods=["GET"])
# def health():
#     """Health check endpoint"""
#     model_status = "loaded" if model.is_loaded() else "not_loaded"
    
#     return jsonify({
#         "status": "healthy",
#         "service": "SecureTrace ML Service",
#         "version": model.model_version,
#         "model_status": model_status,
#         "last_training": model.last_training.isoformat() if model.last_training else None,
#         "timestamp": datetime.utcnow().isoformat(),
#         "auth_required": Config.REQUIRE_AUTH
#     }), 200

# @app.route("/train", methods=["POST"])
# @limiter.limit("5 per minute")
# def train_model():
#     """Train the fraud detection models"""
#     if not authenticate_request():
#         return jsonify({"error": "Unauthorized"}), 401
    
#     try:
#         logger.info("Training request received")
#         result = model.train()
        
#         if result["status"] == "success":
#             return jsonify(result), 200
#         else:
#             return jsonify(result), 500
            
#     except Exception as e:
#         logger.error(f"Training endpoint error: {str(e)}")
#         return jsonify({"error": "Training failed", "message": str(e)}), 500

# @app.route("/predict", methods=["POST"])
# @limiter.limit("200 per minute")
# def predict_fraud():
#     """Predict fraud for transaction features"""
#     if not authenticate_request():
#         return jsonify({"error": "Unauthorized"}), 401
    
#     try:
#         data = request.get_json()
#         if not data or "features" not in data:
#             return jsonify({"error": "Missing 'features' in request body"}), 400
        
#         features = data["features"]
#         if not isinstance(features, list) or len(features) != len(model.feature_columns):
#             return jsonify({
#                 "error": f"Features must be a list of {len(model.feature_columns)} numbers",
#                 "expected_features": model.feature_columns
#             }), 400
        
#         # Auto-train if models not loaded
#         if not model.is_loaded():
#             logger.info("Models not loaded, initiating auto-training...")
#             train_result = model.train()
#             if train_result["status"] != "success":
#                 return jsonify({"error": "Failed to train models", "details": train_result}), 500
        
#         result = model.predict(features)
        
#         if data.get("include_explanation", True):
#             return jsonify(result), 200
#         else:
#             minimal_result = {
#                 "fraud_probability": result["fraud_probability"],
#                 "fraud_prediction": result["fraud_prediction"],
#                 "risk_level": result["risk_level"],
#                 "timestamp": result["timestamp"]
#             }
#             return jsonify(minimal_result), 200
        
#     except Exception as e:
#         logger.error(f"Prediction endpoint error: {str(e)}")
#         return jsonify({"error": "Prediction failed", "message": str(e)}), 500

# @app.route("/model/status", methods=["GET"])
# def model_status():
#     """Get detailed model status and performance metrics"""
#     if not authenticate_request():
#         return jsonify({"error": "Unauthorized"}), 401
    
#     status = {
#         "model_loaded": model.is_loaded(),
#         "model_version": model.model_version,
#         "last_training": model.last_training.isoformat() if model.last_training else None,
#         "performance_metrics": model.performance_metrics,
#         "feature_columns": model.feature_columns,
#         "expected_feature_count": len(model.feature_columns)
#     }
    
#     return jsonify(status), 200

# @app.route("/model/retrain", methods=["POST"])
# @limiter.limit("3 per hour")
# def retrain_model():
#     """Force model retraining"""
#     if not authenticate_request():
#         return jsonify({"error": "Unauthorized"}), 401
    
#     try:
#         logger.info("Manual retraining requested")
#         result = model.train()
#         return jsonify(result), 200 if result["status"] == "success" else 500
#     except Exception as e:
#         logger.error(f"Retrain endpoint error: {str(e)}")
#         return jsonify({"error": "Retraining failed", "message": str(e)}), 500

# # ================= ERROR HANDLERS =================
# @app.errorhandler(404)
# def not_found(error):
#     return jsonify({"error": "Endpoint not found"}), 404

# @app.errorhandler(500)
# def internal_error(error):
#     return jsonify({"error": "Internal server error"}), 500

# @app.errorhandler(429)
# def ratelimit_handler(e):
#     return jsonify({"error": "Rate limit exceeded", "message": str(e.description)}), 429

# # ================= STARTUP =================
# if __name__ == "__main__":
#     logger.info("Starting SecureTrace ML Service...")
    
#     # Auto-train on startup if no models exist
#     if not model.load_models():
#         logger.info("No existing models found. Training models on startup...")
#         try:
#             train_result = model.train()
#             if train_result["status"] == "success":
#                 logger.info("Initial training completed successfully")
#             else:
#                 logger.error("Initial training failed, will train on first prediction request")
#         except Exception as e:
#             logger.error(f"Initial training failed: {str(e)}")
    
#     logger.info(f"Service starting on port {Config.PORT}")
#     logger.info(f"Expected features: {len(model.feature_columns)}")
#     logger.info(f"Authentication required: {Config.REQUIRE_AUTH}")
#     logger.info("Available endpoints:")
#     logger.info("  GET  /health - Health check")
#     logger.info("  POST /train - Train models")  
#     logger.info("  POST /predict - Fraud prediction")
#     logger.info("  GET  /model/status - Model status")
#     logger.info("  POST /model/retrain - Force retrain")
    
#     app.run(host="0.0.0.0", port=Config.PORT, debug=Config.DEBUG)




# C:\Users\aanus\Downloads\AutheTrack\AutheTrack\ml-service\app.py
import os
import logging
import pickle
import traceback
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional

import numpy as np
import pandas as pd
from flask import Flask, jsonify, request
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_cors import CORS
from sklearn.ensemble import RandomForestClassifier, IsolationForest
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score,
    f1_score, roc_auc_score, classification_report
)
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
import joblib

class Config:
    MODEL_PATH = "models/fraud_model.pkl"
    ANOMALY_PATH = "models/anomaly_model.pkl"
    SCALER_PATH = "models/scaler.pkl"
    RATE_LIMIT = "100 per minute"
    PORT = 5001
    DEBUG = True
    
    FRAUD_THRESHOLD = 0.5
    ANOMALY_THRESHOLD = -0.1
    MIN_TRAINING_SAMPLES = 1000
    RETRAIN_INTERVAL_HOURS = 24
    
    API_KEY = os.getenv("ML_API_KEY", "89a6f454a6455c2a9cc85cee4eda59fe61599c632996e8d23300b63ae3efd97d")
    REQUIRE_AUTH = os.getenv("REQUIRE_AUTH", "false").lower() == "true"

os.makedirs("logs", exist_ok=True)
os.makedirs("models", exist_ok=True)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.FileHandler("logs/ml_service.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("SecureTrace-ML")

app = Flask(__name__)

CORS(app, origins=["http://localhost:3001", "http://127.0.0.1:3001", "http://localhost:3000"], 
     methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
     allow_headers=['Content-Type', 'Authorization'])

limiter = Limiter(key_func=get_remote_address, default_limits=[Config.RATE_LIMIT])
limiter.init_app(app)

class FraudDetectionModel:
    def __init__(self):
        self.fraud_classifier = None
        self.anomaly_detector = None
        self.scaler = None
        self.feature_columns = [
            'amount', 'hour', 'day_of_week', 'merchant_risk_score',
            'user_account_age_days', 'transaction_velocity_1h',
            'transaction_velocity_24h', 'avg_transaction_amount',
            'location_risk_score', 'device_risk_score',
            'time_since_last_transaction', 'payment_method_risk',
            'ip_reputation_score', 'behavioral_anomaly_score',
            'cross_border_transaction'
        ]
        self.last_training = None
        self.model_version = "1.0"
        self.performance_metrics = {}
        
    def create_synthetic_data(self, n_samples: int = 10000) -> tuple:
        logger.info(f"Generating {n_samples} synthetic training samples...")
        
        np.random.seed(42)
        
        data = {
            'amount': np.random.lognormal(mean=3, sigma=2, size=n_samples),
            'hour': np.random.randint(0, 24, n_samples),
            'day_of_week': np.random.randint(0, 7, n_samples),
            'merchant_risk_score': np.random.beta(2, 8, n_samples),
            'user_account_age_days': np.random.exponential(scale=365, size=n_samples),
            'transaction_velocity_1h': np.random.poisson(lam=2, size=n_samples),
            'transaction_velocity_24h': np.random.poisson(lam=10, size=n_samples),
            'avg_transaction_amount': np.random.lognormal(mean=2.5, sigma=1.5, size=n_samples),
            'location_risk_score': np.random.beta(1, 9, n_samples),
            'device_risk_score': np.random.beta(1, 4, n_samples),
            'time_since_last_transaction': np.random.exponential(scale=3600, size=n_samples),
            'payment_method_risk': np.random.choice([0.1, 0.3, 0.5, 0.7], n_samples),
            'ip_reputation_score': np.random.beta(8, 2, n_samples),
            'behavioral_anomaly_score': np.random.beta(1, 9, n_samples),
            'cross_border_transaction': np.random.choice([0, 1], n_samples, p=[0.85, 0.15])
        }
        
        df = pd.DataFrame(data)
        
        fraud_probability = (
            0.05 +
            0.3 * (df['amount'] > df['amount'].quantile(0.95)) +
            0.2 * (df['merchant_risk_score'] > 0.7) +
            0.15 * (df['location_risk_score'] > 0.8) +
            0.1 * (df['transaction_velocity_1h'] > 5) +
            0.25 * (df['behavioral_anomaly_score'] > 0.8) +
            0.1 * df['cross_border_transaction']
        )
        
        fraud_probability = np.minimum(fraud_probability, 0.95)
        fraud_labels = np.random.binomial(1, fraud_probability)
        
        X = df[self.feature_columns].values
        y = fraud_labels
        
        logger.info(f"Generated dataset: {len(X)} samples, {np.sum(y)} fraudulent ({np.mean(y)*100:.1f}%)")
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
                n_estimators=100,
                max_depth=10,
                min_samples_split=5,
                min_samples_leaf=2,
                random_state=42,
                class_weight='balanced'
            )
            self.fraud_classifier.fit(X_train_scaled, y_train)
            
            self.anomaly_detector = IsolationForest(
                contamination=0.1,
                random_state=42,
                n_estimators=100
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
                "fraud_percentage": float(np.mean(y) * 100)
            }
            
            self._save_models()
            self.last_training = datetime.now()
            
            logger.info(f"Training completed successfully! Accuracy: {self.performance_metrics['accuracy']:.3f}")
            return {
                "status": "success",
                "metrics": self.performance_metrics,
                "model_version": self.model_version,
                "trained_at": self.last_training.isoformat()
            }
            
        except Exception as e:
            logger.error(f"Training failed: {str(e)}")
            logger.error(traceback.format_exc())
            return {"status": "error", "message": str(e)}
    
    def predict(self, features: List[float]) -> Dict[str, Any]:
        try:
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
            
            result = {
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
                        {
                            "feature": feature,
                            "importance": float(importance),
                            "value": float(value)
                        }
                        for feature, importance, value in top_features
                    ],
                    "risk_factors": [f"{feature}: {value:.2f}" for feature, importance, value in top_features[:3]],
                    "feature_importance": dict(zip(self.feature_columns, [float(x) for x in feature_importance])),
                    "decision_rationale": self._generate_explanation(fraud_prob, top_features)
                }
            }
            
            return result
            
        except Exception as e:
            logger.error(f"Prediction failed: {str(e)}")
            raise e
    
    def _generate_explanation(self, fraud_prob: float, top_features: list) -> str:
        if fraud_prob > 0.7:
            explanation = f"HIGH RISK transaction ({fraud_prob*100:.1f}% fraud probability). "
        elif fraud_prob > 0.5:
            explanation = f"MODERATE RISK transaction ({fraud_prob*100:.1f}% fraud probability). "
        else:
            explanation = f"LOW RISK transaction ({fraud_prob*100:.1f}% fraud probability). "
        
        top_factor = top_features[0]
        explanation += f"Primary concern: {top_factor[0]} (value: {top_factor[2]:.2f}). "
        
        if len(top_features) > 1:
            explanation += f"Secondary factors: {', '.join([f[0] for f in top_features[1:3]])}."
        
        return explanation
    
    def is_loaded(self) -> bool:
        return (self.fraud_classifier is not None and 
                self.anomaly_detector is not None and 
                self.scaler is not None)
    
    def _save_models(self):
        try:
            joblib.dump(self.fraud_classifier, Config.MODEL_PATH)
            joblib.dump(self.anomaly_detector, Config.ANOMALY_PATH)
            joblib.dump(self.scaler, Config.SCALER_PATH)
            logger.info("Models saved successfully")
        except Exception as e:
            logger.error(f"Failed to save models: {str(e)}")
    
    def load_models(self) -> bool:
        try:
            if (os.path.exists(Config.MODEL_PATH) and 
                os.path.exists(Config.ANOMALY_PATH) and 
                os.path.exists(Config.SCALER_PATH)):
                
                self.fraud_classifier = joblib.load(Config.MODEL_PATH)
                self.anomaly_detector = joblib.load(Config.ANOMALY_PATH)
                self.scaler = joblib.load(Config.SCALER_PATH)
                logger.info("Models loaded successfully")
                return True
            else:
                logger.warning("Model files not found")
                return False
        except Exception as e:
            logger.error(f"Failed to load models: {str(e)}")
            return False

model = FraudDetectionModel()

def authenticate_request():
    if not Config.REQUIRE_AUTH:
        return True
        
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return False
    
    token = auth_header.split(' ')[1]
    return token == Config.API_KEY

@app.route("/", methods=["GET"])
def root():
    return jsonify({
        "service": "SecureTrace ML Service",
        "version": model.model_version,
        "status": "running",
        "endpoints": [
            "GET /health - Health check",
            "POST /train - Train models",
            "POST /predict - Fraud prediction",
            "POST /analyze - Fraud analysis with explanation",
            "GET /model/status - Model status",
            "POST /model/retrain - Force retrain"
        ]
    }), 200

@app.route("/health", methods=["GET"])
def health():
    model_status = "loaded" if model.is_loaded() else "not_loaded"
    
    return jsonify({
        "status": "healthy",
        "service": "SecureTrace ML Service",
        "version": model.model_version,
        "model_status": model_status,
        "last_training": model.last_training.isoformat() if model.last_training else None,
        "timestamp": datetime.utcnow().isoformat(),
        "auth_required": Config.REQUIRE_AUTH
    }), 200

@app.route("/train", methods=["POST"])
@limiter.limit("5 per minute")
def train_model():
    if not authenticate_request():
        return jsonify({"error": "Unauthorized"}), 401
    
    try:
        logger.info("Training request received")
        result = model.train()
        
        if result["status"] == "success":
            return jsonify(result), 200
        else:
            return jsonify(result), 500
            
    except Exception as e:
        logger.error(f"Training endpoint error: {str(e)}")
        return jsonify({"error": "Training failed", "message": str(e)}), 500

@app.route("/predict", methods=["POST"])
@limiter.limit("200 per minute")
def predict_fraud():
    if not authenticate_request():
        return jsonify({"error": "Unauthorized"}), 401
    
    try:
        data = request.get_json()
        if not data or "features" not in data:
            return jsonify({"error": "Missing 'features' in request body"}), 400
        
        features = data["features"]
        if not isinstance(features, list) or len(features) != len(model.feature_columns):
            return jsonify({
                "error": f"Features must be a list of {len(model.feature_columns)} numbers",
                "expected_features": model.feature_columns
            }), 400
        
        if not model.is_loaded():
            logger.info("Models not loaded, initiating auto-training...")
            train_result = model.train()
            if train_result["status"] != "success":
                return jsonify({"error": "Failed to train models", "details": train_result}), 500
        
        result = model.predict(features)
        
        if data.get("include_explanation", True):
            return jsonify(result), 200
        else:
            minimal_result = {
                "fraud_probability": result["fraud_probability"],
                "fraud_prediction": result["fraud_prediction"],
                "risk_level": result["risk_level"],
                "timestamp": result["timestamp"]
            }
            return jsonify(minimal_result), 200
        
    except Exception as e:
        logger.error(f"Prediction endpoint error: {str(e)}")
        return jsonify({"error": "Prediction failed", "message": str(e)}), 500

@app.route("/analyze", methods=["POST"])
@limiter.limit("200 per minute")
def analyze_fraud():
    if not authenticate_request():
        return jsonify({"error": "Unauthorized"}), 401
    
    try:
        data = request.get_json()
        if not data or "features" not in data:
            return jsonify({"error": "Missing 'features' in request body"}), 400
        
        features = data["features"]
        if not isinstance(features, list) or len(features) != len(model.feature_columns):
            return jsonify({
                "error": f"Features must be a list of {len(model.feature_columns)} numbers",
                "expected_features": model.feature_columns
            }), 400
        
        if not model.is_loaded():
            logger.info("Models not loaded, initiating auto-training...")
            train_result = model.train()
            if train_result["status"] != "success":
                return jsonify({"error": "Failed to train models", "details": train_result}), 500
        
        result = model.predict(features)
        return jsonify(result), 200
        
    except Exception as e:
        logger.error(f"Analysis endpoint error: {str(e)}")
        return jsonify({"error": "Analysis failed", "message": str(e)}), 500

@app.route("/model/status", methods=["GET"])
def model_status():
    if not authenticate_request():
        return jsonify({"error": "Unauthorized"}), 401
    
    status = {
        "model_loaded": model.is_loaded(),
        "model_version": model.model_version,
        "last_training": model.last_training.isoformat() if model.last_training else None,
        "performance_metrics": model.performance_metrics,
        "feature_columns": model.feature_columns,
        "expected_feature_count": len(model.feature_columns)
    }
    
    return jsonify(status), 200

@app.route("/model/retrain", methods=["POST"])
@limiter.limit("3 per hour")
def retrain_model():
    if not authenticate_request():
        return jsonify({"error": "Unauthorized"}), 401
    
    try:
        logger.info("Manual retraining requested")
        result = model.train()
        return jsonify(result), 200 if result["status"] == "success" else 500
    except Exception as e:
        logger.error(f"Retrain endpoint error: {str(e)}")
        return jsonify({"error": "Retraining failed", "message": str(e)}), 500

@app.route("/retrain", methods=["POST"])
@limiter.limit("3 per hour")
def retrain_by_type():
    if not authenticate_request():
        return jsonify({"error": "Unauthorized"}), 401
    
    try:
        logger.info("Retraining by type requested")
        result = model.train()
        return jsonify(result), 200 if result["status"] == "success" else 500
    except Exception as e:
        logger.error(f"Retrain by type endpoint error: {str(e)}")
        return jsonify({"error": "Retraining failed", "message": str(e)}), 500

@app.errorhandler(404)
def not_found(error):
    return jsonify({"error": "Endpoint not found"}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({"error": "Internal server error"}), 500

@app.errorhandler(429)
def ratelimit_handler(e):
    return jsonify({"error": "Rate limit exceeded", "message": str(e.description)}), 429

if __name__ == "__main__":
    logger.info("Starting SecureTrace ML Service...")
    
    if not model.load_models():
        logger.info("No existing models found. Training models on startup...")
        try:
            train_result = model.train()
            if train_result["status"] == "success":
                logger.info("Initial training completed successfully")
            else:
                logger.error("Initial training failed, will train on first prediction request")
        except Exception as e:
            logger.error(f"Initial training failed: {str(e)}")
    
    logger.info(f"Service starting on port {Config.PORT}")
    logger.info(f"Expected features: {len(model.feature_columns)}")
    logger.info(f"Authentication required: {Config.REQUIRE_AUTH}")
    logger.info("Available endpoints:")
    logger.info("  GET  / - Service info")
    logger.info("  GET  /health - Health check")
    logger.info("  POST /train - Train models")  
    logger.info("  POST /predict - Fraud prediction")
    logger.info("  POST /analyze - Fraud analysis")
    logger.info("  GET  /model/status - Model status")
    logger.info("  POST /model/retrain - Force retrain")
    
    app.run(host="0.0.0.0", port=Config.PORT, debug=Config.DEBUG)