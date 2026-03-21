# ./ml-service/config/settings.py

import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class Config:
    """Configuration class for ML service"""
    
    # Flask Configuration
    FLASK_ENV = os.getenv('FLASK_ENV', 'development')
    FLASK_DEBUG = os.getenv('FLASK_DEBUG', 'False').lower() == 'true'
    HOST = os.getenv('HOST', 'localhost')
    PORT = int(os.getenv('PORT', 5001))
    
    # API Configuration
    API_KEY = os.getenv('API_KEY', '89a6f454a6455c2a9cc85cee4eda59fe61599c632996e8d23300b63ae3efd97d')
    API_VERSION = os.getenv('API_VERSION', '1.0')
    RATE_LIMIT_PER_MINUTE = int(os.getenv('RATE_LIMIT_PER_MINUTE', 100))
    
    # Model Configuration
    MODEL_NAME = os.getenv('MODEL_NAME', 'fraud-detection-v1')
    MODEL_VERSION = os.getenv('MODEL_VERSION', '1.0.0')
    MODEL_PATH = os.getenv('MODEL_PATH', './models/trained_model.pkl')
    SCALER_PATH = os.getenv('SCALER_PATH', './models/scaler.pkl')
    RETRAIN_THRESHOLD_DAYS = int(os.getenv('RETRAIN_THRESHOLD_DAYS', 7))
    MIN_TRAINING_SAMPLES = int(os.getenv('MIN_TRAINING_SAMPLES', 1000))
    
    # Performance Thresholds
    ACCURACY_THRESHOLD = float(os.getenv('ACCURACY_THRESHOLD', 0.80))
    PRECISION_THRESHOLD = float(os.getenv('PRECISION_THRESHOLD', 0.75))
    RECALL_THRESHOLD = float(os.getenv('RECALL_THRESHOLD', 0.75))
    F1_THRESHOLD = float(os.getenv('F1_THRESHOLD', 0.75))
    
    # Logging Configuration
    LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')
    LOG_FILE = os.getenv('LOG_FILE', './logs/ml_service.log')
    
    # Training Configuration
    TRAIN_TEST_SPLIT = float(os.getenv('TRAIN_TEST_SPLIT', 0.2))
    RANDOM_STATE = int(os.getenv('RANDOM_STATE', 42))
    CV_FOLDS = int(os.getenv('CV_FOLDS', 5))
    
    # Feature Engineering
    FEATURE_COUNT = int(os.getenv('FEATURE_COUNT', 15))
    NORMALIZE_FEATURES = os.getenv('NORMALIZE_FEATURES', 'True').lower() == 'true'
    HANDLE_MISSING_VALUES = os.getenv('HANDLE_MISSING_VALUES', 'True').lower() == 'true'
    
    # Database Configuration
    DATABASE_URL = os.getenv('DATABASE_URL', 'sqlite:///ml_predictions.db')
    
    # Monitoring Configuration
    HEALTH_CHECK_INTERVAL = int(os.getenv('HEALTH_CHECK_INTERVAL', 300))
    METRICS_RETENTION_DAYS = int(os.getenv('METRICS_RETENTION_DAYS', 30))
    ENABLE_PREDICTION_LOGGING = os.getenv('ENABLE_PREDICTION_LOGGING', 'True').lower() == 'true'

# ./ml-service/config/__init__.py
# Empty file to make it a Python package