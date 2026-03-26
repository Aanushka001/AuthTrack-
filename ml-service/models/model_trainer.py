import numpy as np
from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report
import logging

logger = logging.getLogger(__name__)


class ModelTrainer:

    def __init__(self, config):
        self.config = config

    def train_optimized_model(self, X: np.ndarray, y: np.ndarray):
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=self.config.RANDOM_STATE, stratify=y
        )

        param_grid = {
            "n_estimators": [100, 150, 200],
            "max_depth": [8, 10, 12, None],
            "min_samples_split": [2, 5, 10],
            "min_samples_leaf": [1, 2, 4],
            "class_weight": ["balanced", "balanced_subsample"],
        }

        grid_search = GridSearchCV(
            RandomForestClassifier(random_state=self.config.RANDOM_STATE),
            param_grid,
            cv=3,
            scoring="f1",
            n_jobs=-1,
            verbose=1,
        )
        grid_search.fit(X_train, y_train)

        best_model = grid_search.best_estimator_
        y_pred = best_model.predict(X_test)

        logger.info(f"Best params: {grid_search.best_params_}")
        logger.info(f"\n{classification_report(y_test, y_pred)}")

        return best_model, X_test, y_test