# -*- coding: utf-8 -*-
"""
Data Preprocessing and Feature Engineering Pipeline
Handles transaction data normalization and feature extraction for ML models
"""

import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler, LabelEncoder
from typing import Tuple, Dict, Any
import logging

logger = logging.getLogger(__name__)


class DataPreprocessor:
    """
    Preprocesses transaction data for ML model inference and training.
    
    Features:
    - Categorical encoding
    - Numerical scaling
    - Feature engineering
    - Missing value handling
    """
    
    def __init__(self):
        """Initialize preprocessor with scalers and encoders"""
        self.scaler = StandardScaler()
        self.label_encoders: Dict[str, LabelEncoder] = {}
        self.feature_names: list = []
        self.numerical_features: list = []
        self.categorical_features: list = []
    
    def fit_transform(self, data: pd.DataFrame) -> np.ndarray:
        """
        Fit preprocessor on training data and transform.
        
        Args:
            data: Training dataframe with features
            
        Returns:
            Transformed feature matrix
        """
        self.feature_names = [col for col in data.columns if col != 'label']
        
        # Separate numerical and categorical features
        self.numerical_features = data[self.feature_names].select_dtypes(
            include=['int64', 'float64']
        ).columns.tolist()
        
        self.categorical_features = data[self.feature_names].select_dtypes(
            include=['object', 'category']
        ).columns.tolist()
        
        # Encode categorical features
        for col in self.categorical_features:
            le = LabelEncoder()
            data.loc[:, col] = le.fit_transform(data[col].astype(str))
            self.label_encoders[col] = le
        
        # Scale numerical features
        data.loc[:, self.numerical_features] = self.scaler.fit_transform(
            data[self.numerical_features]
        )
        
        return data[self.feature_names].values
    
    def transform(self, data: pd.DataFrame) -> np.ndarray:
        """
        Transform new data using fitted preprocessor.
        
        Args:
            data: New dataframe to transform
            
        Returns:
            Transformed feature matrix
        """
        # Encode categorical features
        for col in self.categorical_features:
            if col in data.columns and col in self.label_encoders:
                data.loc[:, col] = self.label_encoders[col].transform(
                    data[col].astype(str)
                )
        
        # Scale numerical features
        if self.numerical_features:
            data.loc[:, self.numerical_features] = self.scaler.transform(
                data[self.numerical_features]
            )
        
        return data[self.feature_names].values
    
    def extract_transaction_features(
        self, 
        transaction: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Extract ML features from raw transaction.
        
        Args:
            transaction: Raw transaction data
            
        Returns:
            Engineered features dictionary
        """
        features = {
            'amount': transaction.get('amount', 0),
            'timestamp': pd.Timestamp(transaction.get('timestamp') or pd.Timestamp.now()),
            'device_id': transaction.get('device_id', ''),
            'user_id': transaction.get('user_id', ''),
            'merchant_id': transaction.get('merchant_id', ''),
            'transaction_type': transaction.get('type', 'unknown'),
        }
        
        # Temporal features
        features['hour_of_day'] = features['timestamp'].hour
        features['day_of_week'] = features['timestamp'].dayofweek
        features['is_weekend'] = features['day_of_week'] >= 5
        
        return features
