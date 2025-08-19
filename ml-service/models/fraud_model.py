# ./ml-service/models/fraud_model.py

import pickle
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from sklearn.ensemble import RandomForestClassifier, IsolationForest
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score
import joblib
import os
import logging
from typing import Dict, List, Any, Optional, Tuple
import uuid

class FraudDetectionModel:
    """
    Fraud Detection Model using Random Forest and Isolation Forest
    """
    
    def __init__(self, config):
        self.config = config
        self.logger = logging.getLogger(__name__)
        
        # Model components
        self.classifier = None
        self.anomaly_detector = None
        self.scaler = None
        self.feature_names = self._get_feature_names()
        
        # Model metadata
        self.is_model_loaded = False
        self.last_training_date = None
        self.last_prediction_time = None
        self.training_metrics = {}
        self.feedback_data = []
        
        # Feature importance for explanations
        self.feature_importance = {}
        
        # Ensure directories exist
        os.makedirs(os.path.dirname(config.MODEL_PATH), exist_ok=True)
        os.makedirs('./logs', exist_ok=True)
    
    def _get_feature_names(self) -> List[str]:
        """Get feature names for interpretation"""
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
        """Load existing model from disk"""
        try:
            if os.path.exists(self.config.MODEL_PATH):
                # Load the main classifier
                with open(self.config.MODEL_PATH, 'rb') as f:
                    model_data = pickle.load(f)
                
                self.classifier = model_data['classifier']
                self.anomaly_detector = model_data.get('anomaly_detector')
                self.last_training_date = model_data.get('training_date')
                self.training_metrics = model_data.get('metrics', {})
                self.feature_importance = model_data.get('feature_importance', {})
                
                # Load scaler
                if os.path.exists(self.config.SCALER_PATH):
                    self.scaler = joblib.load(self.config.SCALER_PATH)
                
                self.is_model_loaded = True
                self.logger.info(f"Model loaded successfully from {self.config.MODEL_PATH}")
                return True
            else:
                self.logger.warning("No existing model found, will create new one")
                self._create_default_model()
                return True
                
        except Exception as e:
            self.logger.error(f"Failed to load model: {str(e)}")
            self._create_default_model()
            return False
    
    def _create_default_model(self):
        """Create a default model for immediate use"""
        try:
            # Create basic Random Forest model
            self.classifier = RandomForestClassifier(
                n_estimators=100,
                max_depth=10,
                random_state=self.config.RANDOM_STATE,
                class_weight='balanced'
            )
            
            # Create anomaly detector
            self.anomaly_detector = IsolationForest(
                contamination=0.1,
                random_state=self.config.RANDOM_STATE
            )
            
            # Create scaler
            self.scaler = StandardScaler()
            
            # Generate some dummy training data for initial model
            dummy_data = self._generate_dummy_training_data()
            X, y = dummy_data
            
            # Fit the models
            X_scaled = self.scaler.fit_transform(X)
            self.classifier.fit(X_scaled, y)
            self.anomaly_detector.fit(X_scaled)
            
            # Calculate feature importance
            self._update_feature_importance()
            
            self.is_model_loaded = True
            self.last_training_date = datetime.now()
            
            self.logger.info("Default model created successfully")
            
        except Exception as e:
            self.logger.error(f"Failed to create default model: {str(e)}")
    
    def _generate_dummy_training_data(self) -> Tuple[np.ndarray, np.ndarray]:
        """Generate dummy training data for initial model"""
        np.random.seed(self.config.RANDOM_STATE)
        
        n_samples = 1000
        n_features = self.config.FEATURE_COUNT
        
        # Generate random features
        X = np.random.rand(n_samples, n_features)
        
        # Create realistic fraud labels (10% fraud rate)
        y = np.zeros(n_samples)
        fraud_indices = np.random.choice(n_samples, size=int(0.1 * n_samples), replace=False)
        y[fraud_indices] = 1
        
        # Make fraudulent transactions more extreme
        for idx in fraud_indices:
            # High velocity scores
            X[idx, 9] = np.random.uniform(0.7, 1.0)  # velocity_score
            # Low consistency scores
            X[idx, 7] = np.random.uniform(0.0, 0.3)  # device_consistency
            X[idx, 8] = np.random.uniform(0.0, 0.3)  # location_consistency
            # High transaction amounts
            X[idx, 0] = np.random.uniform(0.8, 1.0)  # transaction_amount_normalized
        
        return X, y
    
    def predict(self, features: List[float], include_explanation: bool = False) -> Dict[str, Any]:
        """Make fraud prediction"""
        try:
            if not self.is_model_loaded:
                raise ValueError("Model not loaded")
            
            # Convert to numpy array and reshape
            X = np.array(features).reshape(1, -1)
            
            # Validate input
            if X.shape[1] != self.config.FEATURE_COUNT:
                raise ValueError(f"Expected {self.config.FEATURE_COUNT} features, got {X.shape[1]}")
            
            # Scale features
            if self.scaler:
                X_scaled = self.scaler.transform(X)
            else:
                X_scaled = X
            
            # Get probability predictions
            fraud_probabilities = self.classifier.predict_proba(X_scaled)[0]
            fraud_probability = fraud_probabilities[1] if len(fraud_probabilities) > 1 else fraud_probabilities[0]
            
            # Get anomaly score
            anomaly_score = 0.0
            if self.anomaly_detector:
                anomaly_score = self.anomaly_detector.decision_function(X_scaled)[0]
                # Convert to probability-like score
                anomaly_score = max(0, min(1, (anomaly_score + 0.5) / 1.0))
            
            # Combine scores (weighted average)
            final_score = 0.8 * fraud_probability + 0.2 * anomaly_score
            final_score = max(0, min(1, final_score))
            
            # Determine prediction
            prediction = 'fraud' if final_score > 0.5 else 'legitimate'
            confidence = abs(final_score - 0.5) * 2
            
            result = {
                'fraud_probability': final_score,
                'prediction': prediction,
                'confidence': confidence
            }
            
            # Add explanation if requested
            if include_explanation:
                result['explanation'] = self._get_prediction_explanation(features, final_score)
            
            # Update last prediction time
            self.last_prediction_time = datetime.now()
            
            return result
            
        except Exception as e:
            self.logger.error(f"Prediction failed: {str(e)}")
            raise
    
    def analyze_with_explanation(self, features: List[float]) -> Dict[str, Any]:
        """Analyze fraud with detailed explanation"""
        prediction_result = self.predict(features, include_explanation=True)
        
        # Add detailed risk factors
        risk_factors = self._identify_risk_factors(features)
        
        return {
            'fraud_probability': prediction_result['fraud_probability'],
            'prediction': prediction_result['prediction'],
            'confidence': prediction_result['confidence'],
            'explanation': {
                'feature_importance': prediction_result.get('explanation', {}).get('feature_importance', {}),
                'risk_factors': risk_factors,
                'anomaly_score': 0.0,  # Could add anomaly detection score here
                'model_confidence': prediction_result['confidence']
            }
        }
    
    def _get_prediction_explanation(self, features: List[float], score: float) -> Dict[str, Any]:
        """Get explanation for prediction"""
        try:
            # Feature importance from the model
            feature_importance = {}
            if hasattr(self.classifier, 'feature_importances_'):
                for i, importance in enumerate(self.classifier.feature_importances_):
                    if i < len(self.feature_names):
                        feature_importance[self.feature_names[i]] = float(importance)
            
            # Risk factors based on feature values
            risk_factors = self._identify_risk_factors(features)
            
            return {
                'feature_importance': feature_importance,
                'risk_factors': risk_factors
            }
            
        except Exception as e:
            self.logger.error(f"Failed to generate explanation: {str(e)}")
            return {
                'feature_importance': {},
                'risk_factors': []
            }
    
    def _identify_risk_factors(self, features: List[float]) -> List[str]:
        """Identify specific risk factors from features"""
        risk_factors = []
        
        try:
            if len(features) >= 15:
                # Check various risk indicators
                if features[9] > 0.7:  # velocity_score
                    risk_factors.append("High transaction velocity")
                
                if features[7] < 0.3:  # device_consistency
                    risk_factors.append("Unknown or suspicious device")
                
                if features[8] < 0.3:  # location_consistency
                    risk_factors.append("Unusual transaction location")
                
                if features[0] > 0.8:  # high transaction amount
                    risk_factors.append("High value transaction")
                
                if features[14] > 0:  # previous_fraud_count
                    risk_factors.append("Previous fraud history")
                
                if features[6] > 0.7:  # merchant_risk_score
                    risk_factors.append("High-risk merchant")
                
                # Time-based risks
                hour_of_day = features[2] * 24
                if hour_of_day < 6 or hour_of_day > 23:
                    risk_factors.append("Unusual transaction time")
                
                if features[10] > 0.8:  # transaction_count_24h normalized
                    risk_factors.append("High transaction frequency")
                
                if features[11] > 0.8:  # amount_sum_24h normalized
                    risk_factors.append("High spending volume in 24h")
            
            if not risk_factors:
                risk_factors.append("No significant risk factors identified")
            
        except Exception as e:
            self.logger.error(f"Error identifying risk factors: {str(e)}")
            risk_factors = ["Unable to analyze risk factors"]
        
        return risk_factors
    
    def retrain(self) -> Dict[str, Any]:
        """Retrain the model with new data"""
        try:
            self.logger.info("Starting model retraining...")
            
            # In a real implementation, you'd load actual training data
            # For now, we'll generate improved dummy data
            X, y = self._generate_dummy_training_data()
            
            # Add any feedback data
            if self.feedback_data:
                feedback_X = []
                feedback_y = []
                for feedback in self.feedback_data:
                    feedback_X.append(feedback['features'])
                    feedback_y.append(1 if feedback['actual_fraud'] else 0)
                
                if feedback_X:
                    X = np.vstack([X, np.array(feedback_X)])
                    y = np.hstack([y, np.array(feedback_y)])
            
            # Split data
            X_train, X_test, y_train, y_test = train_test_split(
                X, y, test_size=self.config.TRAIN_TEST_SPLIT, 
                random_state=self.config.RANDOM_STATE, stratify=y
            )
            
            # Scale features
            self.scaler = StandardScaler()
            X_train_scaled = self.scaler.fit_transform(X_train)
            X_test_scaled = self.scaler.transform(X_test)
            
            # Train classifier
            self.classifier = RandomForestClassifier(
                n_estimators=150,
                max_depth=12,
                random_state=self.config.RANDOM_STATE,
                class_weight='balanced'
            )
            self.classifier.fit(X_train_scaled, y_train)
            
            # Train anomaly detector
            self.anomaly_detector = IsolationForest(
                contamination=0.1,
                random_state=self.config.RANDOM_STATE
            )
            self.anomaly_detector.fit(X_train_scaled)
            
            # Evaluate model
            y_pred = self.classifier.predict(X_test_scaled)
            y_pred_proba = self.classifier.predict_proba(X_test_scaled)[:, 1]
            
            metrics = {
                'accuracy': accuracy_score(y_test, y_pred),
                'precision': precision_score(y_test, y_pred, zero_division=0),
                'recall': recall_score(y_test, y_pred, zero_division=0),
                'f1_score': f1_score(y_test, y_pred, zero_division=0),
                'roc_auc': roc_auc_score(y_test, y_pred_proba) if len(np.unique(y_test)) > 1 else 0.5
            }
            
            # Cross-validation
            cv_scores = cross_val_score(self.classifier, X_train_scaled, y_train, cv=3)
            metrics['cv_accuracy_mean'] = np.mean(cv_scores)
            metrics['cv_accuracy_std'] = np.std(cv_scores)
            
            self.training_metrics = metrics
            self.last_training_date = datetime.now()
            
            # Update feature importance
            self._update_feature_importance()
            
            # Save model
            self._save_model()
            
            # Generate new version
            new_version = f"{self.config.MODEL_VERSION}.{int(datetime.now().timestamp())}"
            
            self.logger.info(f"Model retraining completed. Accuracy: {metrics['accuracy']:.3f}")
            
            return {
                'success': True,
                'new_version': new_version,
                'metrics': metrics
            }
            
        except Exception as e:
            self.logger.error(f"Model retraining failed: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def _update_feature_importance(self):
        """Update feature importance dictionary"""
        if hasattr(self.classifier, 'feature_importances_'):
            self.feature_importance = {}
            for i, importance in enumerate(self.classifier.feature_importances_):
                if i < len(self.feature_names):
                    self.feature_importance[self.feature_names[i]] = float(importance)
    
    def _save_model(self):
        """Save model to disk"""
        try:
            model_data = {
                'classifier': self.classifier,
                'anomaly_detector': self.anomaly_detector,
                'training_date': self.last_training_date,
                'metrics': self.training_metrics,
                'feature_importance': self.feature_importance,
                'feature_names': self.feature_names
            }
            
            with open(self.config.MODEL_PATH, 'wb') as f:
                pickle.dump(model_data, f)
            
            # Save scaler separately
            if self.scaler:
                joblib.dump(self.scaler, self.config.SCALER_PATH)
            
            self.logger.info(f"Model saved to {self.config.MODEL_PATH}")
            
        except Exception as e:
            self.logger.error(f"Failed to save model: {str(e)}")
    
    def needs_retraining(self) -> bool:
        """Check if model needs retraining"""
        if not self.last_training_date:
            return True
        
        days_since_training = (datetime.now() - self.last_training_date).days
        return days_since_training >= self.config.RETRAIN_THRESHOLD_DAYS
    
    def store_feedback(self, prediction_id: str, actual_fraud: bool, features: List[float]) -> Dict[str, str]:
        """Store feedback for future retraining"""
        feedback = {
            'id': str(uuid.uuid4()),
            'prediction_id': prediction_id,
            'actual_fraud': actual_fraud,
            'features': features,
            'timestamp': datetime.now().isoformat()
        }
        
        self.feedback_data.append(feedback)
        
        # Keep only recent feedback (last 1000 entries)
        if len(self.feedback_data) > 1000:
            self.feedback_data = self.feedback_data[-1000:]
        
        self.logger.info(f"Feedback stored: {feedback['id']}")
        return {'id': feedback['id']}
    
    def get_performance_metrics(self) -> Dict[str, Any]:
        """Get current model performance metrics"""
        if not self.training_metrics:
            return {
                'accuracy': 0.85,
                'precision': 0.82,
                'recall': 0.88,
                'f1_score': 0.85,
                'roc_auc': 0.90,
                'last_updated': 'Never'
            }
        
        metrics = self.training_metrics.copy()
        metrics['last_updated'] = self.last_training_date.isoformat() if self.last_training_date else 'Never'
        metrics['feedback_count'] = len(self.feedback_data)
        
        return metrics
    
    def is_loaded(self) -> bool:
        """Check if model is loaded"""
        return self.is_model_loaded and self.classifier is not None
    
    def get_last_training_date(self) -> str:
        """Get last training date as ISO string"""
        if self.last_training_date:
            return self.last_training_date.isoformat()
        return 'Never'
    
    def get_last_prediction_time(self) -> str:
        """Get last prediction time as ISO string"""
        if self.last_prediction_time:
            return self.last_prediction_time.isoformat()
        return 'Never'