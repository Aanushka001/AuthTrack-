import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler, LabelEncoder
from typing import Tuple, Dict, Any
import logging

logger = logging.getLogger(__name__)

class DataPreprocessor:

    def __init__(self):
        self.scaler = StandardScaler()
        self.label_encoders: Dict[str, LabelEncoder] = {}
        self.feature_names: list = []
        self.numerical_features: list = []
        self.categorical_features: list = []

    def fit_transform(self, data: pd.DataFrame) -> np.ndarray:
        self.feature_names = [col for col in data.columns if col != 'label']

        self.numerical_features = data[self.feature_names].select_dtypes(
            include=['int64', 'float64']
        ).columns.tolist()

        self.categorical_features = data[self.feature_names].select_dtypes(
            include=['object', 'category']
        ).columns.tolist()

        for col in self.categorical_features:
            le = LabelEncoder()
            data.loc[:, col] = le.fit_transform(data[col].astype(str))
            self.label_encoders[col] = le

        data.loc[:, self.numerical_features] = pd.DataFrame(
            self.scaler.fit_transform(data[self.numerical_features]),
            columns=self.numerical_features,
            index=data.index
        )

        return data[self.feature_names].values

    def transform(self, data: pd.DataFrame) -> np.ndarray:
        for col in self.categorical_features:
            if col in data.columns and col in self.label_encoders:
                data.loc[:, col] = self.label_encoders[col].transform(
                    data[col].astype(str)
                )

        if self.numerical_features:
            data.loc[:, self.numerical_features] = pd.DataFrame(
                self.scaler.transform(data[self.numerical_features]),
                columns=self.numerical_features,
                index=data.index
            )

        return data[self.feature_names].values

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