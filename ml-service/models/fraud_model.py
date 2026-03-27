import pickle
import numpy as np
from datetime import datetime
from sklearn.ensemble import RandomForestClassifier, IsolationForest
from sklearn.preprocessing import StandardScaler
import joblib
import os
import logging
from typing import Dict, List, Any, Tuple


class FraudDetectionModel:

    def __init__(self, config):
        self.config = config
        self.logger = logging.getLogger(__name__)

        self.classifier: RandomForestClassifier | None = None
        self.anomaly_detector: IsolationForest | None = None
        self.scaler: StandardScaler | None = None

        self.feature_names = self._get_feature_names()

        self.is_model_loaded = False
        self.last_training_date: datetime | None = None
        self.last_prediction_time: datetime | None = None
        self.training_metrics: Dict[str, Any] = {}
        self.feedback_data: List[Dict[str, Any]] = []

        self.feature_importance: Dict[str, float] = {}

        os.makedirs(os.path.dirname(config.MODEL_PATH), exist_ok=True)
        os.makedirs('./logs', exist_ok=True)

    def _get_feature_names(self) -> List[str]:
        return [
            'transaction_amount_normalized',
            'amount_normalized',
            'hour_of_day',
            'day_of_week',
            'is_weekend',
            'merchant_category_encoded',
            'merchant_risk_score',
            'device_consistency',
            'location_consistency',
            'velocity_score',
            'transaction_count_24h',
            'amount_sum_24h',
            'user_risk_score',
            'account_age',
            'previous_fraud_count'
        ]

    def load_model(self) -> bool:
        try:
            if os.path.exists(self.config.MODEL_PATH):
                with open(self.config.MODEL_PATH, 'rb') as f:
                    model_data = pickle.load(f)

                self.classifier = model_data.get('classifier')
                self.anomaly_detector = model_data.get('anomaly_detector')
                self.last_training_date = model_data.get('training_date')
                self.training_metrics = model_data.get('metrics', {})
                self.feature_importance = model_data.get('feature_importance', {})

                if os.path.exists(self.config.SCALER_PATH):
                    self.scaler = joblib.load(self.config.SCALER_PATH)

                self.is_model_loaded = self.classifier is not None
                return True

            self._create_default_model()
            return True

        except Exception:
            self._create_default_model()
            return False

    def _create_default_model(self):
        self.classifier = RandomForestClassifier(
            n_estimators=100,
            max_depth=10,
            random_state=self.config.RANDOM_STATE,
            class_weight='balanced'
        )

        self.anomaly_detector = IsolationForest(
            contamination=0.1,
            random_state=self.config.RANDOM_STATE
        )

        self.scaler = StandardScaler()

        X, y = self._generate_dummy_training_data()
        X_scaled = self.scaler.fit_transform(X)

        self.classifier.fit(X_scaled, y)
        self.anomaly_detector.fit(X_scaled)

        self._update_feature_importance()

        self.is_model_loaded = True
        self.last_training_date = datetime.now()

    def _generate_dummy_training_data(self) -> Tuple[np.ndarray, np.ndarray]:
        np.random.seed(self.config.RANDOM_STATE)

        X = np.random.rand(1000, self.config.FEATURE_COUNT)
        y = np.zeros(1000)

        fraud_idx = np.random.choice(1000, size=100, replace=False)
        y[fraud_idx] = 1

        for i in fraud_idx:
            X[i, 9] = np.random.uniform(0.7, 1.0)
            X[i, 7] = np.random.uniform(0.0, 0.3)
            X[i, 8] = np.random.uniform(0.0, 0.3)
            X[i, 0] = np.random.uniform(0.8, 1.0)

        return X, y

    def predict(self, features: List[float], include_explanation: bool = False) -> Dict[str, Any]:
        if not self.is_model_loaded or self.classifier is None:
            raise ValueError("Model not loaded")

        X = np.array(features).reshape(1, -1)

        if X.shape[1] != self.config.FEATURE_COUNT:
            raise ValueError("Invalid feature count")

        X_scaled = self.scaler.transform(X) if self.scaler else X

        fraud_probabilities = self.classifier.predict_proba(X_scaled)[0]
        fraud_probability = (
            fraud_probabilities[1]
            if len(fraud_probabilities) > 1
            else fraud_probabilities[0]
        )

        anomaly_score = 0.0
        if self.anomaly_detector:
            score = self.anomaly_detector.decision_function(X_scaled)[0]
            anomaly_score = max(0, min(1, score + 0.5))

        final_score = max(0, min(1, 0.8 * fraud_probability + 0.2 * anomaly_score))

        result = {
            'fraud_probability': final_score,
            'prediction': 'fraud' if final_score > 0.5 else 'legitimate',
            'confidence': abs(final_score - 0.5) * 2
        }

        if include_explanation:
            result['explanation'] = self._get_prediction_explanation(features)

        self.last_prediction_time = datetime.now()
        return result

    def _get_prediction_explanation(self, features: List[float]) -> Dict[str, Any]:
        feature_importance: Dict[str, float] = {}

        if self.classifier is not None and hasattr(self.classifier, 'feature_importances_'):
            for i, importance in enumerate(self.classifier.feature_importances_):
                if i < len(self.feature_names):
                    feature_importance[self.feature_names[i]] = float(importance)

        return {
            'feature_importance': feature_importance,
            'risk_factors': self._identify_risk_factors(features)
        }

    def _identify_risk_factors(self, features: List[float]) -> List[str]:
        risks: List[str] = []

        if len(features) >= 15:
            if features[9] > 0.7:
                risks.append("High transaction velocity")
            if features[7] < 0.3:
                risks.append("Suspicious device")
            if features[8] < 0.3:
                risks.append("Unusual location")
            if features[0] > 0.8:
                risks.append("High amount")

        return risks if risks else ["No major risks"]

    def _update_feature_importance(self):
        if self.classifier is None:
            return

        if hasattr(self.classifier, 'feature_importances_'):
            self.feature_importance = {
                self.feature_names[i]: float(val)
                for i, val in enumerate(self.classifier.feature_importances_)
                if i < len(self.feature_names)
            }

    def is_loaded(self) -> bool:
        return self.is_model_loaded and self.classifier is not None
