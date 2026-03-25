import pytest
import numpy as np
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import FraudDetectionModel, Config

@pytest.fixture
def trained_model():
    m = FraudDetectionModel()
    m.train()
    return m

VALID_FEATURES = [
    150.0, 14.0, 2.0, 0.2, 365.0, 1.0, 5.0, 200.0,
    0.1, 0.2, 3600.0, 0.3, 0.9, 0.1, 0.0,
]

class TestFraudDetectionModel:
    def test_model_not_loaded_before_training(self):
        m = FraudDetectionModel()
        assert m.is_loaded() is False

    def test_model_loaded_after_training(self, trained_model):
        assert trained_model.is_loaded() is True

    def test_train_returns_success_status(self, trained_model):
        result = trained_model.train()
        assert result["status"] == "success"

    def test_train_returns_metrics(self, trained_model):
        result = trained_model.train()
        metrics = result["metrics"]
        assert "accuracy" in metrics
        assert "precision" in metrics
        assert "recall" in metrics
        assert "f1_score" in metrics
        assert "roc_auc" in metrics

    def test_train_accuracy_above_threshold(self, trained_model):
        result = trained_model.train()
        assert result["metrics"]["accuracy"] >= 0.7

    def test_predict_returns_required_keys(self, trained_model):
        result = trained_model.predict(VALID_FEATURES)
        assert "fraud_probability" in result
        assert "fraud_prediction" in result
        assert "prediction" in result
        assert "risk_level" in result
        assert "confidence" in result

    def test_predict_probability_in_valid_range(self, trained_model):
        result = trained_model.predict(VALID_FEATURES)
        assert 0.0 <= result["fraud_probability"] <= 1.0

    def test_predict_prediction_is_valid_label(self, trained_model):
        result = trained_model.predict(VALID_FEATURES)
        assert result["prediction"] in ("fraud", "legitimate")

    def test_predict_risk_level_is_valid(self, trained_model):
        result = trained_model.predict(VALID_FEATURES)
        assert result["risk_level"] in ("LOW", "MEDIUM", "HIGH", "CRITICAL")

    def test_predict_raises_on_wrong_feature_count(self, trained_model):
        with pytest.raises(ValueError, match="Expected 15 features"):
            trained_model.predict([1.0, 2.0, 3.0])

    def test_predict_raises_when_model_not_loaded(self):
        m = FraudDetectionModel()
        with pytest.raises(ValueError, match="Models not loaded"):
            m.predict(VALID_FEATURES)

    def test_predict_explanation_contains_risk_factors(self, trained_model):
        result = trained_model.predict(VALID_FEATURES)
        assert "explanation" in result
        assert "risk_factors" in result["explanation"]
        assert isinstance(result["explanation"]["risk_factors"], list)

    def test_high_risk_features_yield_higher_probability(self, trained_model):
        low_risk = VALID_FEATURES.copy()
        high_risk = VALID_FEATURES.copy()
        high_risk[3] = 0.95
        high_risk[8] = 0.95
        high_risk[13] = 0.95
        high_risk[5] = 10.0

        low = trained_model.predict(low_risk)["fraud_probability"]
        high = trained_model.predict(high_risk)["fraud_probability"]
        assert high >= low

    def test_save_and_load_models(self, trained_model, tmp_path):
        fraud_path = str(tmp_path / "fraud_model.pkl")
        anomaly_path = str(tmp_path / "anomaly_model.pkl")
        scaler_path = str(tmp_path / "scaler.pkl")

        original_paths = (Config.FRAUD_MODEL, Config.ANOMALY_PATH, Config.SCALER_PATH)
        Config.FRAUD_MODEL = fraud_path
        Config.ANOMALY_PATH = anomaly_path
        Config.SCALER_PATH = scaler_path

        try:
            trained_model._save_models()
            assert os.path.exists(fraud_path)
            assert os.path.exists(scaler_path)

            new_model = FraudDetectionModel()
            Config.FRAUD_MODEL = fraud_path
            Config.ANOMALY_PATH = anomaly_path
            Config.SCALER_PATH = scaler_path
            loaded = new_model.load_models()

            assert loaded is True
            assert new_model.is_loaded() is True

            result = new_model.predict(VALID_FEATURES)
            assert "fraud_probability" in result
        finally:
            Config.FRAUD_MODEL, Config.ANOMALY_PATH, Config.SCALER_PATH = original_paths

    def test_synthetic_data_shape(self):
        m = FraudDetectionModel()
        X, y = m.create_synthetic_data()
        assert X.shape[1] == 15
        assert len(X) == len(y)
        assert set(np.unique(y)).issubset({0, 1})

    def test_fraud_rate_in_expected_range(self):
        m = FraudDetectionModel()
        _, y = m.create_synthetic_data()
        fraud_rate = np.mean(y)
        assert 0.05 <= fraud_rate <= 0.50