import pandas as pd
from sklearn.metrics import classification_report, confusion_matrix
import joblib

# Load model
model = joblib.load("models/fraud_model.pkl")

# Load data
data = pd.read_csv("data/sample_data.csv")
X = data.drop("label", axis=1)
y = data["label"]

# Predict
y_pred = model.predict(X)

# Metrics
print("Classification Report:\n", classification_report(y, y_pred))
print("Confusion Matrix:\n", confusion_matrix(y, y_pred))