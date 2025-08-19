// server/src/types/ml.ts

export interface MLPredictionRequest {
  // Example fields; adapt these to your ML service's expected request structure
  features: Record<string, any>;
  [key: string]: any;
}

export interface MLPredictionResponse {
  prediction: any;
  confidence?: number;
  [key: string]: any;
}

export interface MLHealthResponse {
  model_status: string;
  version: string;
  [key: string]: any;
}

export interface MLStatusResponse {
  model_type: string;
  model_version: string;
  accuracy?: number;
  [key: string]: any;
}

export interface MLTrainingResponse {
  status: 'success' | 'failure';
  message?: string;
  model_version?: string;
  metrics?: {
    accuracy?: number;
  };
  [key: string]: any;
}
