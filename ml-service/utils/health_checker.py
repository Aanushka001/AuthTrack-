from datetime import datetime
from typing import Dict, Any


class HealthChecker:
    """Health checking utility for the ML service."""

    def __init__(self, model, config):
        self.model = model
        self.config = config
        self.start_time = datetime.now()
        self.request_count = 0

    def get_health_status(self) -> Dict[str, Any]:
        self.request_count += 1

        model_loaded = self.model.is_loaded()
        model_metrics = self.model.get_performance_metrics()

        if model_loaded and model_metrics.get("accuracy", 0) >= self.config.ACCURACY_THRESHOLD:
            status = "healthy"
        elif model_loaded:
            status = "degraded"
        else:
            status = "unhealthy"

        return {
            "status": status,
            "model_loaded": model_loaded,
            "model_version": self.config.MODEL_VERSION,
            "last_training": self.model.get_last_training_date(),
            "performance_metrics": model_metrics,
            "uptime_seconds": self.get_uptime_seconds(),
            "requests_processed": self.request_count,
            "timestamp": datetime.utcnow().isoformat(),
        }

    def get_uptime_seconds(self) -> int:
        return int((datetime.now() - self.start_time).total_seconds())

    def get_uptime(self) -> str:
        return str(datetime.now() - self.start_time).split(".")[0]

    def get_request_count(self) -> int:
        return self.request_count
