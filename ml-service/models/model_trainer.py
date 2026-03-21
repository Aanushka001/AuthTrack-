# ./ml-service/models/model_trainer.py

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, confusion_matrix
import joblib
from datetime import datetime

class ModelTrainer:
    """Advanced model training with hyperparameter optimization"""
    
    def __init__(self, config):
        self.config = config
    
    def train_optimized_model(self, X, y):
        """Train model with hyperparameter optimization"""
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )
        
        # Hyperparameter grid
        param_grid = {
            'n_estimators': [100, 150, 200],
            'max_depth': [8, 10, 12, None],
            'min_samples_split': [2, 5, 10],
            'min_samples_leaf': [1, 2, 4],
            'class_weight': ['balanced', 'balanced_subsample']
        }
        
        # Grid search
        rf = RandomForestClassifier(random_state=42)
        grid_search = GridSearchCV(
            rf, param_grid, cv=3, scoring='f1', n_jobs=-1, verbose=1
        )
        
        grid_search.fit(X_train, y_train)
        
        # Best model
        best_model = grid_search.best_estimator_
        
        # Evaluate
        y_pred = best_model.predict(X_test)
        
        print("Best parameters:", grid_search.best_params_)
        print("\nClassification Report:")
        print(classification_report(y_test, y_pred))
        
        return best_model, X_test, y_test

# ./ml-service/data/preprocessor.py

import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler, LabelEncoder
from typing import Tuple, Dict, Any

class DataPreprocessor:
    """Data preprocessing for fraud detection"""
    
    def __init__(self):
        self.scaler = StandardScaler()
        self.label_encoders = {}
        self.feature_means = {}
        self.is_fitted = False
    
    def fit_transform(self, df: pd.DataFrame) -> Tuple[np.ndarray, np.ndarray]:
        """Fit preprocessor and transform data"""
        
        # Handle missing values
        df = self._handle_missing_values(df)
        
        # Extract features and target
        X, y = self._extract_features_target(df)
        
        # Fit and transform
        X_processed = self.scaler.fit_transform(X)
        
        self.is_fitted = True
        return X_processed, y
    
    def transform(self, df: pd.DataFrame) -> np.ndarray:
        """Transform new data using fitted preprocessor"""
        if not self.is_fitted:
            raise ValueError("Preprocessor not fitted. Call fit_transform first.")
        
        # Handle missing values
        df = self._handle_missing_values(df)
        
        # Extract features
        X, _ = self._extract_features_target(df)
        
        # Transform
        X_processed = self.scaler.transform(X)
        
        return X_processed
    
    def _handle_missing_values(self, df: pd.DataFrame) -> pd.DataFrame:
        """Handle missing values in the dataset"""
        df = df.copy()
        
        # Numerical columns - fill with median
        numerical_cols = df.select_dtypes(include=[np.number]).columns
        for col in numerical_cols:
            if col in df.columns:
                df[col].fillna(df[col].median(), inplace=True)
        
        # Categorical columns - fill with mode
        categorical_cols = df.select_dtypes(include=['object']).columns
        for col in categorical_cols:
            if col in df.columns:
                df[col].fillna(df[col].mode()[0] if len(df[col].mode()) > 0 else 'unknown', inplace=True)
        
        return df
    
    def _extract_features_target(self, df: pd.DataFrame) -> Tuple[np.ndarray, np.ndarray]:
        """Extract features and target from dataframe"""
        
        # Expected columns (adjust based on your actual data)
        feature_columns = [
            'amount', 'hour', 'day_of_week', 'merchant_category',
            'device_score', 'location_score', 'velocity_score',
            'user_risk_score', 'account_age', 'transaction_count_24h',
            'amount_sum_24h', 'merchant_risk_score', 'is_weekend',
            'is_high_value', 'previous_fraud_count'
        ]
        
        # Create feature matrix
        X = []
        
        for _, row in df.iterrows():
            features = []
            
            # Amount normalization
            amount = row.get('amount', 0)
            features.append(min(amount / 10000, 1.0))  # Normalize to 0-1
            features.append(amount / (amount + 1))  # Alternative normalization
            
            # Time features
            features.append(row.get('hour', 12) / 24.0)
            features.append(row.get('day_of_week', 0) / 7.0)
            features.append(1 if row.get('is_weekend', False) else 0)
            
            # Merchant category encoding
            merchant_cat = row.get('merchant_category', 'unknown')
            features.append(self._encode_merchant_category(merchant_cat))
            
            # Risk scores (already normalized 0-1)
            features.append(row.get('merchant_risk_score', 0.5))
            features.append(row.get('device_score', 0.5))
            features.append(row.get('location_score', 0.5))
            features.append(row.get('velocity_score', 0.0))
            
            # Transaction patterns
            features.append(min(row.get('transaction_count_24h', 0) / 50, 1.0))
            features.append(min(row.get('amount_sum_24h', 0) / 50000, 1.0))
            
            # User features
            features.append(row.get('user_risk_score', 0.1))
            features.append(min(row.get('account_age', 0) / 5, 1.0))  # Normalize by 5 years
            features.append(min(row.get('previous_fraud_count', 0) / 10, 1.0))
            
            # Binary features
            features.append(1 if row.get('is_high_value', False) else 0)
            features.append(1 if row.get('is_new_merchant', False) else 0)
            
            X.append(features)
        
        X = np.array(X)
        
        # Extract target if available
        if 'is_fraud' in df.columns:
            y = df['is_fraud'].values
        else:
            y = np.zeros(len(X))  # Dummy target for prediction
        
        return X, y
    
    def _encode_merchant_category(self, category: str) -> float:
        """Encode merchant category to risk score"""
        category_risk = {
            'grocery': 0.1,
            'gas': 0.15,
            'restaurant': 0.2,
            'retail': 0.3,
            'online': 0.4,
            'travel': 0.5,
            'entertainment': 0.6,
            'gambling': 0.8,
            'crypto': 0.9,
            'unknown': 0.5,
            'high_risk': 0.95
        }
        
        return category_risk.get(category.lower(), 0.5)

# ./ml-service/data/sample_data.csv
# Create a sample CSV file with the following header:
# amount,hour,day_of_week,merchant_category,device_score,location_score,velocity_score,user_risk_score,account_age,transaction_count_24h,amount_sum_24h,merchant_risk_score,is_weekend,is_high_value,previous_fraud_count,is_fraud

# ./ml-service/models/__init__.py
# Empty file to make it a Python package

# ./ml-service/data/__init__.py  
# Empty file to make it a Python package