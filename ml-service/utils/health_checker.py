class HealthChecker:
    def __init__(self):
        self.status = "ok"

    def check(self):
        return {"status": self.status, "message": "Service is healthy"}
