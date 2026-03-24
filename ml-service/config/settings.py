import os
from pathlib import Path
from dotenv import load_dotenv

root_env_path = Path(__file__).parent.parent.parent / ".env"
load_dotenv(dotenv_path=str(root_env_path))


class Config:
    # Flask
    FLASK_ENV = os.getenv("FLASK_ENV", "production")
    FLASK_DEBUG = FLASK_ENV == "development"
    HOST = os.getenv("HOST", "0.0.0.0")
    PORT = int(os.getenv("ML_SERVICE_PORT", 5001))

    # API
    API_KEY = os.getenv("ML_API_KEY", "")
    API_VERSION = os.getenv("API_VERSION", "1.0")
    REQUIRE_AUTH = os.getenv("REQUIRE_AUTH", "false").lower() == "true"
    RATE_LIMIT_PER_MINUTE = int(os.getenv("RATE_LIMIT_PER_MINUTE", 100))

    # Model
    MODEL_NAME = os.getenv("MODEL_NAME", "fraud-detection-v1")
    MODEL_VERSION = os.getenv("MODEL_VERSION", "1.0.0")
    MODEL_PATH = os.getenv("MODEL_PATH", "./models/fraud_model.pkl")
    ANOMALY_MODEL_PATH = os.getenv("ANOMALY_MODEL_PATH", "./models/anomaly_model.pkl")
    SCALER_PATH = os.getenv("SCALER_PATH", "./models/scaler.pkl")
    RETRAIN_THRESHOLD_DAYS = int(os.getenv("RETRAIN_THRESHOLD_DAYS", 7))
    MIN_TRAINING_SAMPLES = int(os.getenv("MIN_TRAINING_SAMPLES", 1000))
    FEATURE_COUNT = int(os.getenv("FEATURE_COUNT", 15))
    RANDOM_STATE = int(os.getenv("RANDOM_STATE", 42))
    TRAIN_TEST_SPLIT = float(os.getenv("TRAIN_TEST_SPLIT", 0.2))

    # Logging
    LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
    LOG_FILE = os.getenv("LOG_FILE", "./logs/ml_service.log")

    # Performance thresholds
    ACCURACY_THRESHOLD = float(os.getenv("ACCURACY_THRESHOLD", 0.80))
    PRECISION_THRESHOLD = float(os.getenv("PRECISION_THRESHOLD", 0.75))
    RECALL_THRESHOLD = float(os.getenv("RECALL_THRESHOLD", 0.75))
    F1_THRESHOLD = float(os.getenv("F1_THRESHOLD", 0.75))

    # Monitoring
    HEALTH_CHECK_INTERVAL = int(os.getenv("HEALTH_CHECK_INTERVAL", 300))
    ENABLE_PREDICTION_LOGGING = os.getenv("ENABLE_PREDICTION_LOGGING", "true").lower() == "true"