# ./ml-service/utils/logger.py

import logging
import os
from datetime import datetime

def setup_logger(name: str, level: str = 'INFO', log_file: str = None) -> logging.Logger:
    """
    Setup logger with both console and file handlers
    """
    
    # Create logger
    logger = logging.getLogger(name)
    logger.setLevel(getattr(logging, level.upper()))
    
    # Prevent duplicate handlers
    if logger.handlers:
        return logger
    
    # Create formatter
    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    
    # Console handler
    console_handler = logging.StreamHandler()
    console_handler.setLevel(getattr(logging, level.upper()))
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)
    
    # File handler (if log file specified)
    if log_file:
        # Ensure log directory exists
        os.makedirs(os.path.dirname(log_file), exist_ok=True)
        
        file_handler = logging.FileHandler(log_file)
        file_handler.setLevel(getattr(logging, level.upper()))
        file_handler.setFormatter(formatter)
        logger.addHandler(file_handler)
    
    return logger

# ./ml-service/utils/health_checker.py

import time
from datetime import datetime, timedelta
from typing import Dict, Any

class HealthChecker:
    """Health checking utility for ML service"""
    
    def __init__(self, model, config):
        self.model = model
        self.config = config
        self.start_time = datetime.now()
        self.request_count = 0
        self.last_health_check = None
    
    def get_health_status(self) -> Dict[str, Any]:
        """Get comprehensive health status"""
        self.request_count += 1
        self.last_health_check = datetime.now()
        
        # Check model status
        model_loaded = self.model.is_loaded()
        model_metrics = self.model.get_performance_metrics()
        
        # Determine overall status
        if model_loaded and model_metrics.get('accuracy', 0) >= self.config.ACCURACY_THRESHOLD:
            status = 'healthy'
        elif model_loaded:
            status = 'degraded'
        else:
            status = 'unhealthy'
        
        return {
            'status': status,
            'model_loaded': model_loaded,
            'model_version': self.config.MODEL_VERSION,
            'last_training': self.model.get_last_training_date(),
            'performance_metrics': model_metrics,
            'uptime_seconds': self.get_uptime_seconds(),
            'requests_processed': self.request_count,
            'timestamp': datetime.utcnow().isoformat()
        }
    
    def get_uptime(self) -> str:
        """Get uptime as human readable string"""
        uptime = datetime.now() - self.start_time
        return str(uptime).split('.')[0]  # Remove microseconds
    
    def get_uptime_seconds(self) -> int:
        """Get uptime in seconds"""
        uptime = datetime.now() - self.start_time
        return int(uptime.total_seconds())
    
    def get_request_count(self) -> int:
        """Get total request count"""
        return self.request_count

# ./ml-service/utils/__init__.py
# Empty file to make it a Python package