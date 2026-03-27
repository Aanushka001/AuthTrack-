import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler, LabelEncoder
from typing import Dict, Any, List
import logging

logger = logging.getLogger(__name__)


class DataPreprocessor:

    def __init__(self):
        self.scaler = StandardScaler()
        self.label_encoders: Dict[str, LabelEncoder] = {}
        self.feature_names: List[str] = []
        self.numerical_features: List[str] = []
        self.categorical_features: List[str] = []

    def fit_transform(self, data: pd.DataFrame) -> np.ndarray:
        data = data.copy()  # avoid mutation side-effects

        self.feature_names = [col for col in data.columns if col != 'label']

        self.numerical_features = data[self.feature_names].select_dtypes(
            include=['int64', 'float64']
        ).columns.tolist()

        self.categorical_features = data[self.feature_names].select_dtypes(
            include=['object', 'category']
        ).columns.tolist()

        # ✅ FIX: safe assignment using Series
        for col in self.categorical_features:
            le = LabelEncoder()
            encoded = le.fit_transform(data[col].astype(str))

            data[col] = pd.Series(encoded, index=data.index, dtype="int64")
            self.label_encoders[col] = le

        # scale numeric
        if self.numerical_features:
            scaled = self.scaler.fit_transform(data[self.numerical_features])

            data[self.numerical_features] = pd.DataFrame(
                scaled,
                columns=self.numerical_features,
                index=data.index
            )

        return data[self.feature_names].to_numpy()

    def transform(self, data: pd.DataFrame) -> np.ndarray:
        data = data.copy()

        # ✅ FIX: safe transform assignment
        for col in self.categorical_features:
            if col in data.columns and col in self.label_encoders:
                encoded = self.label_encoders[col].transform(
                    data[col].astype(str)
                )

                data[col] = pd.Series(encoded, index=data.index, dtype="int64")

        if self.numerical_features:
            scaled = self.scaler.transform(data[self.numerical_features])

            data[self.numerical_features] = pd.DataFrame(
                scaled,
                columns=self.numerical_features,
                index=data.index
            )

        return data[self.feature_names].to_numpy()

    def extract_transaction_features(self, transaction: Dict[str, Any]) -> Dict[str, Any]:
        features = {
            'amount': transaction.get('amount', 0),
            'timestamp': pd.Timestamp(transaction.get('timestamp') or pd.Timestamp.now()),
            'device_id': transaction.get('device_id', ''),
            'user_id': transaction.get('user_id', ''),
            'merchant_id': transaction.get('merchant_id', ''),
            'transaction_type': transaction.get('type', 'unknown'),
        }

        features['hour_of_day'] = features['timestamp'].hour
        features['day_of_week'] = features['timestamp'].dayofweek
        features['is_weekend'] = features['day_of_week'] >= 5

        return features
    
    