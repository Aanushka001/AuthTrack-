import pytest
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import app, model


@pytest.fixture
def client():
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client


@pytest.fixture(autouse=True)
def ensure_model_trained():
    """Train model once before all tests."""
    if not model.is_loaded():
        model.train()


VALID_FEATURES = [
    150.0,   # amount
    14.0,    # hour
    2.0,     # day_of_week
    0.2,     # merchant_risk_score
    365.0,   # user_account_age_days
    1.0,     # transaction_velocity_1h
    5.0,     # transaction_velocity_24h
    200.0,   # avg_transaction_amount
    0.1,     # location_risk_score
    0.2,     # device_risk_score
    3600.0,  # time_since_last_transaction
    0.3,     # payment_method_risk
    0.9,     # ip_reputation_score
    0.1,     # behavioral_anomaly_score
    0.0,     # cross_border_transaction
]


class TestHealth:
    def test_health_returns_200(self, client):
        res = client.get("/health")
        assert res.status_code == 200

    def test_health_contains_required_fields(self, client):
        data = client.get("/health").get_json()
        assert data["status"] == "healthy"
        assert "model_status" in data
        assert "timestamp" in data

    def test_health_model_loaded_after_fixture(self, client):
        data = client.get("/health").get_json()
        assert data["model_status"] == "loaded"


class TestPredict:
    def test_predict_returns_200_with_valid_features(self, client):
        res = client.post("/predict", json={"features": VALID_FEATURES})
        assert res.status_code == 200

    def test_predict_returns_required_fields(self, client):
        data = client.post("/predict", json={"features": VALID_FEATURES}).get_json()
        assert "fraud_probability" in data
        assert "fraud_prediction" in data
        assert "risk_level" in data
        assert "timestamp" in data

    def test_predict_fraud_probability_in_range(self, client):
        data = client.post("/predict", json={"features": VALID_FEATURES}).get_json()
        assert 0.0 <= data["fraud_probability"] <= 1.0

    def test_predict_returns_400_missing_features(self, client):
        res = client.post("/predict", json={"model": "fraud"})
        assert res.status_code == 400

    def test_predict_returns_400_wrong_feature_count(self, client):
        res = client.post("/predict", json={"features": [1.0, 2.0, 3.0]})
        assert res.status_code == 400
        data = res.get_json()
        assert "expected_features" in data

    def test_predict_high_risk_features_higher_score(self, client):
        high_risk = VALID_FEATURES.copy()
        high_risk[3] = 0.95   # merchant_risk_score high
        high_risk[8] = 0.95   # location_risk_score high
        high_risk[13] = 0.95  # behavioral_anomaly_score high

        normal = client.post("/predict", json={"features": VALID_FEATURES}).get_json()
        risky = client.post("/predict", json={"features": high_risk}).get_json()

        assert risky["fraud_probability"] >= normal["fraud_probability"]

    def test_predict_without_explanation(self, client):
        data = client.post(
            "/predict", json={"features": VALID_FEATURES, "include_explanation": False}
        ).get_json()
        assert "explanation" not in data
        assert "fraud_probability" in data


class TestAnalyze:
    def test_analyze_returns_explanation(self, client):
        data = client.post("/analyze", json={"features": VALID_FEATURES}).get_json()
        assert "explanation" in data
        assert "risk_factors" in data["explanation"]
        assert "feature_importance" in data["explanation"]

    def test_analyze_returns_400_missing_features(self, client):
        res = client.post("/analyze", json={})
        assert res.status_code == 400


class TestModelStatus:
    def test_model_status_returns_200(self, client):
        res = client.get("/model/status")
        assert res.status_code == 200

    def test_model_status_contains_metadata(self, client):
        data = client.get("/model/status").get_json()
        assert data["model_loaded"] is True
        assert "feature_columns" in data
        assert data["expected_feature_count"] == 15


class TestRoot:
    def test_root_returns_service_info(self, client):
        data = client.get("/").get_json()
        assert data["service"] == "SecureTrace ML Service"
        assert "endpoints" in data


class TestAuth:
    def test_unauthenticated_request_allowed_when_auth_disabled(self, client):
        """REQUIRE_AUTH=false by default — requests should pass without token."""
        res = client.get("/model/status")
        assert res.status_code == 200