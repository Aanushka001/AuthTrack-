// ### server/src/services/MLService.ts

// import axios, { AxiosInstance, AxiosResponse } from 'axios';
// import { logger } from '../utils/logger';
// import { MLFeatures } from '../types';

// interface MLPredictionRequest {
//   features: number[];
//   model_name?: string;
//   include_explanation?: boolean;
// }

// interface MLPredictionResponse {
//   fraud_probability: number;
//   prediction: 'fraud' | 'legitimate';
//   confidence: number;
//   model_version: string;
//   explanation?: {
//     feature_importance: Record<string, number>;
//     risk_factors: string[];
//   };
// }

// interface MLHealthResponse {
//   status: 'healthy' | 'degraded' | 'unhealthy';
//   model_loaded: boolean;
//   model_version: string;
//   last_training: string;
//   performance_metrics: {
//     accuracy: number;
//     precision: number;
//     recall: number;
//     f1_score: number;
//   };
// }

// interface MLRetrainResponse {
//   success: boolean;
//   message: string;
//   new_model_version?: string;
//   training_metrics?: {
//     accuracy: number;
//     loss: number;
//     epochs: number;
//   };
// }

// export class MLService {
//   private client: AxiosInstance;
//   private mlServiceUrl: string;
//   private mlApiKey: string;
//   private mlModelName: string;
//   private isServiceHealthy: boolean = false;
//   private lastHealthCheck: Date | null = null;
//   private readonly HEALTH_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes

//   constructor() {
//     // Read from environment variables
//     this.mlServiceUrl = process.env.ML_SERVICE_URL || 'http://localhost:5001';
//     this.mlApiKey = process.env.ML_API_KEY || 'dev-ml-key-123456';
//     this.mlModelName = process.env.ML_MODEL_NAME || 'fraud-detection-v1';

//     // Configure axios client
//     this.client = axios.create({
//       baseURL: this.mlServiceUrl,
//       timeout: 2000, // 2 second timeout for real-time predictions
//       headers: {
//         'Content-Type': 'application/json',
//         'Authorization': `Bearer ${this.mlApiKey}`,
//         'X-API-Version': '1.0',
//         'User-Agent': 'SecureTrace-AI/1.0'
//       }
//     });

//     // Add response interceptors for error handling
//     this.client.interceptors.response.use(
//       (response) => response,
//       (error) => {
//         logger.warn('ML Service request failed', {
//           url: error.config?.url,
//           status: error.response?.status,
//           message: error.message
//         });
//         return Promise.reject(error);
//       }
//     );

//     // Initial health check
//     this.checkMLServiceHealth();
//   }

//   /**
//    * Predict fraud probability for a transaction using structured MLFeatures
//    */
//   async predictFraud(features: any): Promise<number> {
//     try {
//       // Check service health periodically
//       await this.ensureServiceHealth();

//       if (!this.isServiceHealthy) {
//         logger.warn('ML Service unhealthy, using fallback prediction');
//         return this.fallbackPrediction(features);
//       }

//       const preprocessedFeatures = this.preprocessFeatures(features);
//       const requestPayload: MLPredictionRequest = {
//         features: preprocessedFeatures,
//         model_name: this.mlModelName,
//         include_explanation: true
//       };

//       const response: AxiosResponse<MLPredictionResponse> = await this.client.post('/predict', requestPayload);

//       if (response.data && typeof response.data.fraud_probability === 'number') {
//         // Log prediction for monitoring
//         logger.info('ML prediction completed', {
//           fraud_probability: response.data.fraud_probability,
//           prediction: response.data.prediction,
//           confidence: response.data.confidence,
//           model_version: response.data.model_version
//         });

//         return Math.max(0, Math.min(1, response.data.fraud_probability));
//       } else {
//         logger.warn('Invalid ML service response format, using fallback');
//         return this.fallbackPrediction(features);
//       }

//     } catch (error: any) {
//       logger.error('ML Service prediction failed', {
//         error: error.message,
//         status: error.response?.status,
//         data: error.response?.data
//       });
      
//       // Mark service as unhealthy on persistent errors
//       if (error.code === 'ECONNREFUSED' || error.response?.status >= 500) {
//         this.isServiceHealthy = false;
//       }
      
//       return this.fallbackPrediction(features);
//     }
//   }

//   /**
//    * Process structured MLFeatures for comprehensive fraud analysis
//    */
//   async predictFraudFromMLFeatures(mlFeatures: MLFeatures): Promise<{
//     riskScore: number;
//     prediction: 'fraud' | 'legitimate';
//     confidence: number;
//     modelVersion: string;
//   }> {
//     try {
//       await this.ensureServiceHealth();

//       const featureVector = this.convertMLFeaturesToVector(mlFeatures);
//       const requestPayload: MLPredictionRequest = {
//         features: featureVector,
//         model_name: this.mlModelName,
//         include_explanation: false
//       };

//       const response: AxiosResponse<MLPredictionResponse> = await this.client.post('/predict', requestPayload);

//       return {
//         riskScore: response.data.fraud_probability,
//         prediction: response.data.prediction,
//         confidence: response.data.confidence,
//         modelVersion: response.data.model_version
//       };

//     } catch (error: any) {
//       logger.error('MLFeatures prediction failed', { error: error.message });
//       const fallbackScore = this.fallbackPredictionFromMLFeatures(mlFeatures);
//       return {
//         riskScore: fallbackScore,
//         prediction: fallbackScore > 0.5 ? 'fraud' : 'legitimate',
//         confidence: Math.abs(fallbackScore - 0.5) * 2,
//         modelVersion: 'fallback-v1'
//       };
//     }
//   }

//   /**
//    * Get detailed fraud analysis with explanation
//    */
//   async analyzeFraudWithExplanation(features: any): Promise<{
//     riskScore: number;
//     prediction: 'fraud' | 'legitimate';
//     confidence: number;
//     explanation: {
//       riskFactors: string[];
//       featureImportance: Record<string, number>;
//     };
//   }> {
//     try {
//       await this.ensureServiceHealth();

//       if (!this.isServiceHealthy) {
//         const fallbackScore = this.fallbackPrediction(features);
//         return {
//           riskScore: fallbackScore,
//           prediction: fallbackScore > 0.5 ? 'fraud' : 'legitimate',
//           confidence: Math.abs(fallbackScore - 0.5) * 2,
//           explanation: {
//             riskFactors: this.getFallbackRiskFactors(features),
//             featureImportance: {}
//           }
//         };
//       }

//       const preprocessedFeatures = this.preprocessFeatures(features);
//       const response: AxiosResponse<MLPredictionResponse> = await this.client.post('/analyze', {
//         features: preprocessedFeatures,
//         model_name: this.mlModelName,
//         include_explanation: true
//       });

//       return {
//         riskScore: response.data.fraud_probability,
//         prediction: response.data.prediction,
//         confidence: response.data.confidence,
//         explanation: {
//           riskFactors: response.data.explanation?.risk_factors || [],
//           featureImportance: response.data.explanation?.feature_importance || {}
//         }
//       };

//     } catch (error: any) {
//       logger.error('ML fraud analysis failed', { error: error.message });
//       const fallbackScore = this.fallbackPrediction(features);
//       return {
//         riskScore: fallbackScore,
//         prediction: fallbackScore > 0.5 ? 'fraud' : 'legitimate',
//         confidence: Math.abs(fallbackScore - 0.5) * 2,
//         explanation: {
//           riskFactors: this.getFallbackRiskFactors(features),
//           featureImportance: {}
//         }
//       };
//     }
//   }

//   /**
//    * Trigger model retraining
//    */
//   async retrain(): Promise<boolean> {
//     try {
//       logger.info('Initiating ML model retraining');
      
//       const response: AxiosResponse<MLRetrainResponse> = await this.client.post('/retrain', {
//         model_name: this.mlModelName,
//         force: false
//       }, {
//         timeout: 300000 // 5 minutes for retraining
//       });

//       if (response.data.success) {
//         logger.info('ML model retraining completed successfully', {
//           new_version: response.data.new_model_version,
//           metrics: response.data.training_metrics
//         });
//         return true;
//       } else {
//         logger.error('ML model retraining failed', { message: response.data.message });
//         return false;
//       }

//     } catch (error: any) {
//       logger.error('ML model retraining request failed', { error: error.message });
//       return false;
//     }
//   }

//   /**
//    * Get ML service health and model metrics
//    */
//   async getServiceHealth(): Promise<MLHealthResponse | null> {
//     try {
//       const response: AxiosResponse<MLHealthResponse> = await this.client.get('/health', {
//         timeout: 5000
//       });

//       this.isServiceHealthy = response.data.status === 'healthy' && response.data.model_loaded;
//       this.lastHealthCheck = new Date();

//       return response.data;

//     } catch (error: any) {
//       logger.error('ML service health check failed', { error: error.message });
//       this.isServiceHealthy = false;
//       return null;
//     }
//   }

//   /**
//    * Get model performance metrics
//    */
//   async getModelMetrics(): Promise<any> {
//     try {
//       const response = await this.client.get('/metrics', {
//         params: { model_name: this.mlModelName }
//       });

//       return response.data;

//     } catch (error: any) {
//       logger.error('Failed to get model metrics', { error: error.message });
//       return {
//         accuracy: 0.85,
//         precision: 0.82,
//         recall: 0.88,
//         f1_score: 0.85,
//         last_updated: new Date().toISOString()
//       };
//     }
//   }

//   /**
//    * Convert structured MLFeatures to feature vector
//    */
//   private convertMLFeaturesToVector(mlFeatures: MLFeatures): number[] {
//     return [
//       this.normalizeValue(mlFeatures.transactionAmount, 0, 10000),
//       mlFeatures.timeOfDay / 24,
//       mlFeatures.dayOfWeek / 7,
//       mlFeatures.merchantRisk,
//       mlFeatures.locationRisk,
//       mlFeatures.deviceRisk,
//       mlFeatures.velocityScore,
//       mlFeatures.patternScore,
//       mlFeatures.behaviorScore,
//       mlFeatures.networkRisk,
//       mlFeatures.sessionAnomalyScore,
//       this.normalizeValue(mlFeatures.accountAge, 0, 5),
//       mlFeatures.historicalRisk,
//       mlFeatures.crossReferenceScore,
//       mlFeatures.biometricScore
//     ].map(f => isNaN(f) ? 0 : f);
//   }

//   /**
//    * Fallback prediction using structured MLFeatures
//    */
//   private fallbackPredictionFromMLFeatures(mlFeatures: MLFeatures): number {
//     let riskScore = 0.1;

//     // Weight the structured features appropriately
//     riskScore += mlFeatures.velocityScore * 0.2;
//     riskScore += mlFeatures.deviceRisk * 0.15;
//     riskScore += mlFeatures.locationRisk * 0.15;
//     riskScore += mlFeatures.merchantRisk * 0.1;
//     riskScore += mlFeatures.behaviorScore * 0.15;
//     riskScore += mlFeatures.historicalRisk * 0.1;
//     riskScore += mlFeatures.sessionAnomalyScore * 0.1;
//     riskScore += mlFeatures.networkRisk * 0.05;

//     return Math.min(Math.max(riskScore, 0), 1.0);
//   }

//   /**
//    * Preprocess features for ML model (legacy format)
//    */
//   private preprocessFeatures(features: any): number[] {
//     const featureVector = [
//       this.normalizeValue(features.amount || 0, 0, 10000),
//       features.amountNormalized || 1.0,
//       (features.hourOfDay || 0) / 24,
//       (features.dayOfWeek || 0) / 7,
//       features.isWeekend ? 1 : 0,
//       this.encodeMerchantCategory(features.merchantCategory || 'unknown'),
//       features.merchantRiskScore || 0.5,
//       features.deviceConsistency || 0.5,
//       features.locationConsistency || 0.5,
//       features.velocityScore || 0,
//       this.normalizeValue(features.transactionCount24h || 0, 0, 50),
//       this.normalizeValue(features.amountSum24h || 0, 0, 50000),
//       features.userRiskScore || 0.1,
//       this.normalizeValue(features.accountAge || 0, 0, 5),
//       this.normalizeValue(features.previousFraudCount || 0, 0, 10),
//       features.isHighValueTransaction ? 1 : 0,
//       features.isNewMerchant ? 1 : 0
//     ];

//     // Ensure all features are valid numbers
//     return featureVector.map(f => isNaN(f) ? 0 : f);
//   }

//   private normalizeValue(value: number, min: number, max: number): number {
//     if (max === min) return 0;
//     return Math.max(0, Math.min(1, (value - min) / (max - min)));
//   }

//   private encodeMerchantCategory(category: string): number {
//     const categoryMap: Record<string, number> = {
//       'grocery': 0.1,
//       'gas': 0.15,
//       'restaurant': 0.2,
//       'retail': 0.3,
//       'online': 0.4,
//       'travel': 0.5,
//       'entertainment': 0.6,
//       'gambling': 0.8,
//       'crypto': 0.9,
//       'unknown': 0.5,
//       'high_risk': 0.95
//     };
    
//     return categoryMap[category.toLowerCase()] || 0.5;
//   }

//   /**
//    * Rule-based fallback prediction when ML service is unavailable
//    */
//   private fallbackPrediction(features: any): number {
//     let riskScore = 0.1; // Base risk score
    
//     // Velocity-based risk
//     if (features.velocityScore > 0.8) riskScore += 0.4;
//     else if (features.velocityScore > 0.6) riskScore += 0.2;
//     else if (features.velocityScore > 0.4) riskScore += 0.1;
    
//     // Device consistency risk
//     if (features.deviceConsistency < 0.2) riskScore += 0.3;
//     else if (features.deviceConsistency < 0.5) riskScore += 0.15;
    
//     // Location consistency risk
//     if (features.locationConsistency < 0.1) riskScore += 0.3;
//     else if (features.locationConsistency < 0.3) riskScore += 0.15;
    
//     // Transaction amount risk
//     if (features.isHighValueTransaction) riskScore += 0.1;
//     if (features.amount > 5000) riskScore += 0.1;
    
//     // Merchant and account risk
//     if (features.isNewMerchant && features.amount > 1000) riskScore += 0.15;
//     if (features.merchantRiskScore > 0.7) riskScore += 0.1;
//     if (features.previousFraudCount > 0) riskScore += 0.2;
    
//     // Time-based risk
//     if (features.hourOfDay < 6 || features.hourOfDay > 23) riskScore += 0.05;
    
//     return Math.min(Math.max(riskScore, 0), 1.0);
//   }

//   private getFallbackRiskFactors(features: any): string[] {
//     const factors: string[] = [];
    
//     if (features.velocityScore > 0.6) factors.push('High transaction velocity');
//     if (features.deviceConsistency < 0.5) factors.push('Unknown or suspicious device');
//     if (features.locationConsistency < 0.3) factors.push('Unusual location');
//     if (features.isHighValueTransaction) factors.push('High value transaction');
//     if (features.isNewMerchant) factors.push('New merchant');
//     if (features.merchantRiskScore > 0.7) factors.push('High-risk merchant');
//     if (features.previousFraudCount > 0) factors.push('Previous fraud history');
    
//     return factors.length > 0 ? factors : ['No specific risk factors identified'];
//   }

//   /**
//    * Ensure ML service health with periodic checks
//    */
//   private async ensureServiceHealth(): Promise<void> {
//     const now = new Date();
//     const shouldCheckHealth = !this.lastHealthCheck || 
//       (now.getTime() - this.lastHealthCheck.getTime()) > this.HEALTH_CHECK_INTERVAL;

//     if (shouldCheckHealth) {
//       await this.checkMLServiceHealth();
//     }
//   }

//   /**
//    * Check ML service health
//    */
//   private async checkMLServiceHealth(): Promise<void> {
//     try {
//       const health = await this.getServiceHealth();
//       this.isServiceHealthy = health?.status === 'healthy' && health.model_loaded;
      
//       if (this.isServiceHealthy) {
//         logger.debug('ML Service health check passed');
//       } else {
//         logger.warn('ML Service health check failed', { health });
//       }
//     } catch (error) {
//       this.isServiceHealthy = false;
//       logger.warn('ML Service health check error', { error });
//     }
//   }

//   /**
//    * Get service status for monitoring
//    */
//   public getStatus(): {
//     serviceUrl: string;
//     isHealthy: boolean;
//     lastHealthCheck: Date | null;
//     modelName: string;
//   } {
//     return {
//       serviceUrl: this.mlServiceUrl,
//       isHealthy: this.isServiceHealthy,
//       lastHealthCheck: this.lastHealthCheck,
//       modelName: this.mlModelName
//     };
//   }
// }


// // server/src/services/MLService.ts

// import axios, { AxiosInstance, AxiosResponse } from 'axios';
// import { logger } from '../utils/logger';
// import { MLFeatures } from '../types';

// interface MLPredictionRequest {
//   features: number[];
//   model_name?: string;
//   include_explanation?: boolean;
// }

// interface MLPredictionResponse {
//   fraud_probability: number;
//   prediction: 'fraud' | 'legitimate';
//   confidence: number;
//   model_version: string;
//   explanation?: {
//     feature_importance: Record<string, number>;
//     risk_factors: string[];
//   };
// }

// interface MLHealthResponse {
//   status: 'healthy' | 'degraded' | 'unhealthy';
//   model_loaded: boolean;
//   model_version: string;
//   last_training: string;
//   performance_metrics: {
//     accuracy: number;
//     precision: number;
//     recall: number;
//     f1_score: number;
//   };
// }

// interface MLRetrainResponse {
//   success: boolean;
//   message: string;
//   new_model_version?: string;
//   training_metrics?: {
//     accuracy: number;
//     loss: number;
//     epochs: number;
//   };
// }

// export class MLService {
//   private client: AxiosInstance;
//   private mlServiceUrl: string;
//   private mlApiKey: string;
//   private mlModelName: string;
//   private isServiceHealthy: boolean = false;
//   private lastHealthCheck: Date | null = null;
//   private readonly HEALTH_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes
//   private fallbackEnabled: boolean = true;
//   private consecutiveFailures: number = 0;
//   private readonly MAX_CONSECUTIVE_FAILURES = 3;

//   constructor() {
//     // Read from environment variables
//     this.mlServiceUrl = process.env.ML_SERVICE_URL || 'http://localhost:5001';
//     this.mlApiKey = process.env.ML_API_KEY || 'dev-ml-key-123456';
//     this.mlModelName = process.env.ML_MODEL_NAME || 'fraud-detection-v1';
//     this.fallbackEnabled = process.env.ML_FALLBACK_ENABLED === 'true';

//     // Configure axios client
//     this.client = axios.create({
//       baseURL: this.mlServiceUrl,
//       timeout: parseInt(process.env.ML_SERVICE_TIMEOUT || '2000'),
//       headers: {
//         'Content-Type': 'application/json',
//         'Authorization': `Bearer ${this.mlApiKey}`,
//         'X-API-Version': '1.0',
//         'User-Agent': 'SecureTrace-AI/1.0'
//       }
//     });

//     // Add response interceptors for error handling
//     this.client.interceptors.response.use(
//       (response) => {
//         this.consecutiveFailures = 0; // Reset on success
//         return response;
//       },
//       (error) => {
//         this.consecutiveFailures++;
        
//         // Only log if we haven't exceeded the failure threshold
//         if (this.consecutiveFailures <= this.MAX_CONSECUTIVE_FAILURES) {
//           logger.warn('ML Service request failed', {
//             url: error.config?.url,
//             status: error.response?.status,
//             message: error.message,
//             consecutiveFailures: this.consecutiveFailures
//           });
//         }
        
//         return Promise.reject(error);
//       }
//     );

//     // Validate configuration
//     this.validateConfiguration();

//     // Initial health check (silent)
//     this.checkMLServiceHealth(true);
//   }

//   /**
//    * Validate ML service configuration
//    */
//   private validateConfiguration(): void {
//     const config = {
//       serviceUrl: this.mlServiceUrl,
//       modelName: this.mlModelName,
//       timeout: this.client.defaults.timeout,
//       fallbackEnabled: this.fallbackEnabled
//     };

//     logger.info('ML Service configuration validated successfully', config);
//   }

//   /**
//    * Predict fraud probability for a transaction using structured MLFeatures
//    */
//   async predictFraud(features: any): Promise<number> {
//     try {
//       // Check service health periodically
//       await this.ensureServiceHealth();

//       if (!this.isServiceHealthy) {
//         if (this.fallbackEnabled) {
//           return this.fallbackPrediction(features);
//         } else {
//           throw new Error('ML Service unavailable and fallback disabled');
//         }
//       }

//       const preprocessedFeatures = this.preprocessFeatures(features);
//       const requestPayload: MLPredictionRequest = {
//         features: preprocessedFeatures,
//         model_name: this.mlModelName,
//         include_explanation: true
//       };

//       const response: AxiosResponse<MLPredictionResponse> = await this.client.post('/predict', requestPayload);

//       if (response.data && typeof response.data.fraud_probability === 'number') {
//         // Log prediction for monitoring (only occasionally to reduce noise)
//         if (Math.random() < 0.1) { // Log 10% of predictions
//           logger.debug('ML prediction completed', {
//             fraud_probability: response.data.fraud_probability,
//             prediction: response.data.prediction,
//             confidence: response.data.confidence,
//             model_version: response.data.model_version
//           });
//         }

//         return Math.max(0, Math.min(1, response.data.fraud_probability));
//       } else {
//         logger.warn('Invalid ML service response format, using fallback');
//         return this.fallbackPrediction(features);
//       }

//     } catch (error: any) {
//       // Only log if we haven't exceeded the failure threshold or it's a new type of error
//       if (this.consecutiveFailures <= this.MAX_CONSECUTIVE_FAILURES) {
//         logger.error('ML Service prediction failed', {
//           error: error.message,
//           status: error.response?.status,
//           data: error.response?.data,
//           consecutiveFailures: this.consecutiveFailures
//         });
//       }
      
//       // Mark service as unhealthy on persistent errors
//       if (error.code === 'ECONNREFUSED' || error.response?.status >= 500) {
//         this.isServiceHealthy = false;
//       }
      
//       if (this.fallbackEnabled) {
//         return this.fallbackPrediction(features);
//       } else {
//         throw error;
//       }
//     }
//   }

//   /**
//    * Process structured MLFeatures for comprehensive fraud analysis
//    */
//   async predictFraudFromMLFeatures(mlFeatures: MLFeatures): Promise<{
//     riskScore: number;
//     prediction: 'fraud' | 'legitimate';
//     confidence: number;
//     modelVersion: string;
//   }> {
//     try {
//       await this.ensureServiceHealth();

//       if (!this.isServiceHealthy && this.fallbackEnabled) {
//         const fallbackScore = this.fallbackPredictionFromMLFeatures(mlFeatures);
//         return {
//           riskScore: fallbackScore,
//           prediction: fallbackScore > 0.5 ? 'fraud' : 'legitimate',
//           confidence: Math.abs(fallbackScore - 0.5) * 2,
//           modelVersion: 'fallback-v1'
//         };
//       }

//       const featureVector = this.convertMLFeaturesToVector(mlFeatures);
//       const requestPayload: MLPredictionRequest = {
//         features: featureVector,
//         model_name: this.mlModelName,
//         include_explanation: false
//       };

//       const response: AxiosResponse<MLPredictionResponse> = await this.client.post('/predict', requestPayload);

//       return {
//         riskScore: response.data.fraud_probability,
//         prediction: response.data.prediction,
//         confidence: response.data.confidence,
//         modelVersion: response.data.model_version
//       };

//     } catch (error: any) {
//       if (this.consecutiveFailures <= this.MAX_CONSECUTIVE_FAILURES) {
//         logger.error('MLFeatures prediction failed', { error: error.message });
//       }
      
//       if (this.fallbackEnabled) {
//         const fallbackScore = this.fallbackPredictionFromMLFeatures(mlFeatures);
//         return {
//           riskScore: fallbackScore,
//           prediction: fallbackScore > 0.5 ? 'fraud' : 'legitimate',
//           confidence: Math.abs(fallbackScore - 0.5) * 2,
//           modelVersion: 'fallback-v1'
//         };
//       } else {
//         throw error;
//       }
//     }
//   }

//   /**
//    * Get detailed fraud analysis with explanation
//    */
//   async analyzeFraudWithExplanation(features: any): Promise<{
//     riskScore: number;
//     prediction: 'fraud' | 'legitimate';
//     confidence: number;
//     explanation: {
//       riskFactors: string[];
//       featureImportance: Record<string, number>;
//     };
//   }> {
//     try {
//       await this.ensureServiceHealth();

//       if (!this.isServiceHealthy && this.fallbackEnabled) {
//         const fallbackScore = this.fallbackPrediction(features);
//         return {
//           riskScore: fallbackScore,
//           prediction: fallbackScore > 0.5 ? 'fraud' : 'legitimate',
//           confidence: Math.abs(fallbackScore - 0.5) * 2,
//           explanation: {
//             riskFactors: this.getFallbackRiskFactors(features),
//             featureImportance: {}
//           }
//         };
//       }

//       const preprocessedFeatures = this.preprocessFeatures(features);
//       const response: AxiosResponse<MLPredictionResponse> = await this.client.post('/analyze', {
//         features: preprocessedFeatures,
//         model_name: this.mlModelName,
//         include_explanation: true
//       });

//       return {
//         riskScore: response.data.fraud_probability,
//         prediction: response.data.prediction,
//         confidence: response.data.confidence,
//         explanation: {
//           riskFactors: response.data.explanation?.risk_factors || [],
//           featureImportance: response.data.explanation?.feature_importance || {}
//         }
//       };

//     } catch (error: any) {
//       if (this.consecutiveFailures <= this.MAX_CONSECUTIVE_FAILURES) {
//         logger.error('ML fraud analysis failed', { error: error.message });
//       }
      
//       if (this.fallbackEnabled) {
//         const fallbackScore = this.fallbackPrediction(features);
//         return {
//           riskScore: fallbackScore,
//           prediction: fallbackScore > 0.5 ? 'fraud' : 'legitimate',
//           confidence: Math.abs(fallbackScore - 0.5) * 2,
//           explanation: {
//             riskFactors: this.getFallbackRiskFactors(features),
//             featureImportance: {}
//           }
//         };
//       } else {
//         throw error;
//       }
//     }
//   }

//   /**
//    * Trigger model retraining
//    */
//   async retrain(): Promise<boolean> {
//     try {
//       logger.info('Initiating ML model retraining');
      
//       const response: AxiosResponse<MLRetrainResponse> = await this.client.post('/retrain', {
//         model_name: this.mlModelName,
//         force: false
//       }, {
//         timeout: 300000 // 5 minutes for retraining
//       });

//       if (response.data.success) {
//         logger.info('ML model retraining completed successfully', {
//           new_version: response.data.new_model_version,
//           metrics: response.data.training_metrics
//         });
//         return true;
//       } else {
//         logger.error('ML model retraining failed', { message: response.data.message });
//         return false;
//       }

//     } catch (error: any) {
//       logger.error('ML model retraining request failed', { error: error.message });
//       return false;
//     }
//   }

//   /**
//    * Get ML service health and model metrics
//    */
//   async getServiceHealth(silent: boolean = false): Promise<MLHealthResponse | null> {
//     try {
//       const response: AxiosResponse<MLHealthResponse> = await this.client.get('/health', {
//         timeout: 5000
//       });

//       this.isServiceHealthy = response.data.status === 'healthy' && response.data.model_loaded;
//       this.lastHealthCheck = new Date();
      
//       // Reset failure counter on successful health check
//       if (this.isServiceHealthy && this.consecutiveFailures > 0) {
//         logger.info('ML Service recovered after failures', { 
//           previousFailures: this.consecutiveFailures 
//         });
//         this.consecutiveFailures = 0;
//       }

//       return response.data;

//     } catch (error: any) {
//       this.isServiceHealthy = false;
      
//       // Only log health check failures if not silent and within failure threshold
//       if (!silent && this.consecutiveFailures <= this.MAX_CONSECUTIVE_FAILURES) {
//         logger.error('ML service health check failed', { 
//           error: error.message,
//           consecutiveFailures: this.consecutiveFailures
//         });
//       }
      
//       return null;
//     }
//   }

//   /**
//    * Get model performance metrics
//    */
//   async getModelMetrics(): Promise<any> {
//     try {
//       const response = await this.client.get('/metrics', {
//         params: { model_name: this.mlModelName }
//       });

//       return response.data;

//     } catch (error: any) {
//       logger.error('Failed to get model metrics', { error: error.message });
//       return {
//         accuracy: 0.85,
//         precision: 0.82,
//         recall: 0.88,
//         f1_score: 0.85,
//         last_updated: new Date().toISOString()
//       };
//     }
//   }

//   /**
//    * Convert structured MLFeatures to feature vector
//    */
//   private convertMLFeaturesToVector(mlFeatures: MLFeatures): number[] {
//     return [
//       this.normalizeValue(mlFeatures.transactionAmount, 0, 10000),
//       mlFeatures.timeOfDay / 24,
//       mlFeatures.dayOfWeek / 7,
//       mlFeatures.merchantRisk,
//       mlFeatures.locationRisk,
//       mlFeatures.deviceRisk,
//       mlFeatures.velocityScore,
//       mlFeatures.patternScore,
//       mlFeatures.behaviorScore,
//       mlFeatures.networkRisk,
//       mlFeatures.sessionAnomalyScore,
//       this.normalizeValue(mlFeatures.accountAge, 0, 5),
//       mlFeatures.historicalRisk,
//       mlFeatures.crossReferenceScore,
//       mlFeatures.biometricScore
//     ].map(f => isNaN(f) ? 0 : f);
//   }

//   /**
//    * Fallback prediction using structured MLFeatures
//    */
//   private fallbackPredictionFromMLFeatures(mlFeatures: MLFeatures): number {
//     let riskScore = 0.1;

//     // Weight the structured features appropriately
//     riskScore += mlFeatures.velocityScore * 0.2;
//     riskScore += mlFeatures.deviceRisk * 0.15;
//     riskScore += mlFeatures.locationRisk * 0.15;
//     riskScore += mlFeatures.merchantRisk * 0.1;
//     riskScore += mlFeatures.behaviorScore * 0.15;
//     riskScore += mlFeatures.historicalRisk * 0.1;
//     riskScore += mlFeatures.sessionAnomalyScore * 0.1;
//     riskScore += mlFeatures.networkRisk * 0.05;

//     return Math.min(Math.max(riskScore, 0), 1.0);
//   }

//   /**
//    * Preprocess features for ML model (legacy format)
//    */
//   private preprocessFeatures(features: any): number[] {
//     const featureVector = [
//       this.normalizeValue(features.amount || 0, 0, 10000),
//       features.amountNormalized || 1.0,
//       (features.hourOfDay || 0) / 24,
//       (features.dayOfWeek || 0) / 7,
//       features.isWeekend ? 1 : 0,
//       this.encodeMerchantCategory(features.merchantCategory || 'unknown'),
//       features.merchantRiskScore || 0.5,
//       features.deviceConsistency || 0.5,
//       features.locationConsistency || 0.5,
//       features.velocityScore || 0,
//       this.normalizeValue(features.transactionCount24h || 0, 0, 50),
//       this.normalizeValue(features.amountSum24h || 0, 0, 50000),
//       features.userRiskScore || 0.1,
//       this.normalizeValue(features.accountAge || 0, 0, 5),
//       this.normalizeValue(features.previousFraudCount || 0, 0, 10),
//       features.isHighValueTransaction ? 1 : 0,
//       features.isNewMerchant ? 1 : 0
//     ];

//     // Ensure all features are valid numbers
//     return featureVector.map(f => isNaN(f) ? 0 : f);
//   }

//   private normalizeValue(value: number, min: number, max: number): number {
//     if (max === min) return 0;
//     return Math.max(0, Math.min(1, (value - min) / (max - min)));
//   }

//   private encodeMerchantCategory(category: string): number {
//     const categoryMap: Record<string, number> = {
//       'grocery': 0.1,
//       'gas': 0.15,
//       'restaurant': 0.2,
//       'retail': 0.3,
//       'online': 0.4,
//       'travel': 0.5,
//       'entertainment': 0.6,
//       'gambling': 0.8,
//       'crypto': 0.9,
//       'unknown': 0.5,
//       'high_risk': 0.95
//     };
    
//     return categoryMap[category.toLowerCase()] || 0.5;
//   }

//   /**
//    * Rule-based fallback prediction when ML service is unavailable
//    */
//   private fallbackPrediction(features: any): number {
//     let riskScore = 0.1; // Base risk score
    
//     // Velocity-based risk
//     if (features.velocityScore > 0.8) riskScore += 0.4;
//     else if (features.velocityScore > 0.6) riskScore += 0.2;
//     else if (features.velocityScore > 0.4) riskScore += 0.1;
    
//     // Device consistency risk
//     if (features.deviceConsistency < 0.2) riskScore += 0.3;
//     else if (features.deviceConsistency < 0.5) riskScore += 0.15;
    
//     // Location consistency risk
//     if (features.locationConsistency < 0.1) riskScore += 0.3;
//     else if (features.locationConsistency < 0.3) riskScore += 0.15;
    
//     // Transaction amount risk
//     if (features.isHighValueTransaction) riskScore += 0.1;
//     if (features.amount > 5000) riskScore += 0.1;
    
//     // Merchant and account risk
//     if (features.isNewMerchant && features.amount > 1000) riskScore += 0.15;
//     if (features.merchantRiskScore > 0.7) riskScore += 0.1;
//     if (features.previousFraudCount > 0) riskScore += 0.2;
    
//     // Time-based risk
//     if (features.hourOfDay < 6 || features.hourOfDay > 23) riskScore += 0.05;
    
//     return Math.min(Math.max(riskScore, 0), 1.0);
//   }

//   private getFallbackRiskFactors(features: any): string[] {
//     const factors: string[] = [];
    
//     if (features.velocityScore > 0.6) factors.push('High transaction velocity');
//     if (features.deviceConsistency < 0.5) factors.push('Unknown or suspicious device');
//     if (features.locationConsistency < 0.3) factors.push('Unusual location');
//     if (features.isHighValueTransaction) factors.push('High value transaction');
//     if (features.isNewMerchant) factors.push('New merchant');
//     if (features.merchantRiskScore > 0.7) factors.push('High-risk merchant');
//     if (features.previousFraudCount > 0) factors.push('Previous fraud history');
    
//     return factors.length > 0 ? factors : ['No specific risk factors identified'];
//   }

//   /**
//    * Ensure ML service health with periodic checks
//    */
//   private async ensureServiceHealth(): Promise<void> {
//     const now = new Date();
//     const shouldCheckHealth = !this.lastHealthCheck || 
//       (now.getTime() - this.lastHealthCheck.getTime()) > this.HEALTH_CHECK_INTERVAL;

//     if (shouldCheckHealth) {
//       await this.checkMLServiceHealth(true);
//     }
//   }

//   /**
//    * Check ML service health
//    */
//   private async checkMLServiceHealth(silent: boolean = false): Promise<void> {
//     try {
//       const health = await this.getServiceHealth(silent);
//       this.isServiceHealthy = health?.status === 'healthy' && health.model_loaded;
      
//       if (this.isServiceHealthy && !silent) {
//         logger.debug('ML Service health check passed');
//       }
//     } catch (error) {
//       this.isServiceHealthy = false;
//       if (!silent && this.consecutiveFailures <= this.MAX_CONSECUTIVE_FAILURES) {
//         logger.warn('ML Service health check error', { error });
//       }
//     }
//   }

//   /**
//    * Get service status for monitoring
//    */
//   public getStatus(): {
//     serviceUrl: string;
//     isHealthy: boolean;
//     lastHealthCheck: Date | null;
//     modelName: string;
//     fallbackEnabled: boolean;
//     consecutiveFailures: number;
//   } {
//     return {
//       serviceUrl: this.mlServiceUrl,
//       isHealthy: this.isServiceHealthy,
//       lastHealthCheck: this.lastHealthCheck,
//       modelName: this.mlModelName,
//       fallbackEnabled: this.fallbackEnabled,
//       consecutiveFailures: this.consecutiveFailures
//     };
//   }
// }

// // Create and export singleton instance
// export const mlService = new MLService();

// // server/src/services/MLService.ts

// import axios, { AxiosInstance, AxiosResponse } from 'axios';
// import { logger } from '../utils/logger';
// import {
//   MLPredictionRequest,
//   MLPredictionResponse,
//   MLHealthResponse,
//   MLStatusResponse,
//   MLTrainingResponse
// } from '../types/ml';

// // Interfaces should be imported or defined somewhere
// // import { MLPredictionRequest, MLPredictionResponse, MLHealthResponse, MLStatusResponse, MLTrainingResponse } from './types';

// export class MLService {
//   private client: AxiosInstance;
//   private readonly apiKey: string;
//   private readonly baseUrl: string;
//   private consecutiveFailures = 0;
//   private lastHealthCheck: Date | null = null;
//   private isHealthy = false;

//   constructor() {
//     this.baseUrl = process.env.ML_SERVICE_URL || 'http://localhost:5001';
//     this.apiKey =
//       process.env.ML_API_KEY ||
//       '89a6f454a6455c2a9cc85cee4eda59fe61599c632996e8d23300b63ae3efd97d';

//     this.client = axios.create({
//       baseURL: this.baseUrl,
//       timeout: 10000,
//       headers: {
//         'Content-Type': 'application/json',
//         Authorization: `Bearer ${this.apiKey}`,
//       },
//     });

//     // Request interceptor
//     this.client.interceptors.request.use(
//       (config) => {
//         logger.debug(
//           `ML Service Request: ${config.method?.toUpperCase()} ${config.url}`,
//           { service: 'ml-service-client' }
//         );
//         return config;
//       },
//       (error) => {
//         logger.error('ML Service Request Error:', error);
//         return Promise.reject(error);
//       }
//     );

//     // Response interceptor
//     this.client.interceptors.response.use(
//       (response) => {
//         this.consecutiveFailures = 0;
//         this.isHealthy = true;
//         logger.debug(`ML Service Response: ${response.status}`, {
//           service: 'ml-service-client',
//         });
//         return response;
//       },
//       (error) => {
//         this.consecutiveFailures++;
//         if (this.consecutiveFailures > 3) {
//           this.isHealthy = false;
//         }
//         logger.error(
//           `ML Service Error (${this.consecutiveFailures} consecutive failures):`,
//           {
//             message: error.message,
//             status: error.response?.status,
//             data: error.response?.data,
//             service: 'ml-service-client',
//           }
//         );
//         return Promise.reject(error);
//       }
//     );
//   }

//   /**
//    * Run fraud prediction
//    */
//   async predict(payload: MLPredictionRequest): Promise<MLPredictionResponse> {
//     try {
//       const response: AxiosResponse<MLPredictionResponse> = await this.client.post('/predict', payload);
//       return response.data;
//     } catch (error: any) {
//       logger.error('Fraud prediction request failed', {
//         error: error.message,
//         service: 'ml-service-client',
//       });
//       throw error;
//     }
//   }

//   /**
//    * Health check for ML service
//    */
//   async healthCheck(): Promise<MLHealthResponse> {
//     try {
//       const response: AxiosResponse<MLHealthResponse> = await this.client.get('/health');
//       this.lastHealthCheck = new Date();
//       this.isHealthy = true;

//       logger.info('ML Service health check successful', {
//         status: response.data.model_status,
//         version: response.data.version,
//         service: 'ml-service-client',
//       });

//       return response.data;
//     } catch (error: any) {
//       this.isHealthy = false;
//       logger.warn('ML Service health check failed', {
//         error: error.message,
//         consecutiveFailures: this.consecutiveFailures,
//         service: 'ml-service-client',
//       });
//       throw error;
//     }
//   }

//   /**
//    * Get detailed model status
//    */
//   async getModelStatus(): Promise<MLStatusResponse> {
//     try {
//       const response: AxiosResponse<MLStatusResponse> = await this.client.get('/model/status');
//       return response.data;
//     } catch (error: any) {
//       logger.error('Failed to get model status:', error);
//       throw error;
//     }
//   }

//   /**
//    * Train the ML models
//    */
//   async trainModel(): Promise<MLTrainingResponse> {
//     try {
//       logger.info('Initiating ML model training...', {
//         service: 'ml-service-client',
//       });

//       const response: AxiosResponse<MLTrainingResponse> = await this.client.post('/train');

//       if (response.data.status === 'success') {
//         logger.info('ML model training completed successfully', {
//           accuracy: response.data.metrics?.accuracy,
//           version: response.data.model_version,
//           service: 'ml-service-client',
//         });
//       } else {
//         logger.error('ML model training failed', {
//           message: response.data.message,
//           service: 'ml-service-client',
//         });
//       }

//       return response.data;
//     } catch (error: any) {
//       logger.error('ML model training request failed:', error);
//       throw error;
//     }
//   }

//   /**
//    * Force retraining
//    */
//   async retrainModel(force: boolean = true): Promise<MLTrainingResponse> {
//     try {
//       logger.info('Initiating ML model retraining...', {
//         force,
//         service: 'ml-service-client',
//       });

//       const response: AxiosResponse<MLTrainingResponse> = await this.client.post('/retrain', { force });

//       return response.data;
//     } catch (error: any) {
//       logger.error('ML model retraining failed:', error);
//       throw error;
//     }
//   }

//   /**
//    * Generic retrain by type
//    */
//   async retrain(modelType: string): Promise<MLTrainingResponse> {
//     // modelType can be used to send extra info if your API supports different types
//     try {
//       logger.info('Initiating ML model retraining by type...', {
//         modelType,
//         service: 'ml-service-client',
//       });

//       const response: AxiosResponse<MLTrainingResponse> = await this.client.post('/retrain', { modelType });
//       return response.data;
//     } catch (error: any) {
//       logger.error('ML model retraining by type failed:', error);
//       throw error;
//     }
//   }

//   /**
//    * Get current service status (for monitoring)
//    */
//   getStatus() {
//     return {
//       serviceUrl: this.baseUrl,
//       isHealthy: this.isHealthy,
//       lastHealthCheck: this.lastHealthCheck,
//       consecutiveFailures: this.consecutiveFailures
//     };
//   }
// }

// // Singleton export
// export const mlService = new MLService();


// ### server/src/services/MLService.ts
import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { logger } from '../utils/logger';
import {
  MLPredictionRequest,
  MLPredictionResponse,
  MLHealthResponse,
  MLStatusResponse,
  MLTrainingResponse
} from '../types/ml';

interface MLExplanation {
  riskFactors: string[];
  featureImportance: Record<string, number>;
}

interface MLAnalysisResponse {
  riskScore: number;
  prediction: 'fraud' | 'legitimate';
  confidence: number;
  explanation: MLExplanation;
}

export class MLService {
  private client: AxiosInstance;
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly modelName: string;
  private consecutiveFailures = 0;
  private lastHealthCheck: Date | null = null;
  private isHealthy = false;

  constructor() {
    this.baseUrl = process.env.ML_SERVICE_URL || 'http://localhost:5001';
    this.apiKey = process.env.ML_API_KEY || '89a6f454a6455c2a9cc85cee4eda59fe61599c632996e8d23300b63ae3efd97d';
    this.modelName = process.env.ML_MODEL_NAME || 'fraud-detection-v1';

    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
    });

    this.client.interceptors.request.use(
      (config) => {
        logger.debug(
          `ML Service Request: ${config.method?.toUpperCase()} ${config.url}`,
          { service: 'ml-service-client' }
        );
        return config;
      },
      (error) => {
        logger.error('ML Service Request Error:', error);
        return Promise.reject(error);
      }
    );

    this.client.interceptors.response.use(
      (response) => {
        this.consecutiveFailures = 0;
        this.isHealthy = true;
        logger.debug(`ML Service Response: ${response.status}`, {
          service: 'ml-service-client',
        });
        return response;
      },
      (error) => {
        this.consecutiveFailures++;
        if (this.consecutiveFailures > 3) {
          this.isHealthy = false;
        }
        logger.error(
          `ML Service Error (${this.consecutiveFailures} consecutive failures):`,
          {
            message: error.message,
            status: error.response?.status,
            data: error.response?.data,
            service: 'ml-service-client',
          }
        );
        return Promise.reject(error);
      }
    );
  }

  async predict(payload: MLPredictionRequest): Promise<MLPredictionResponse> {
    try {
      const response: AxiosResponse<MLPredictionResponse> = await this.client.post('/predict', payload);
      return response.data;
    } catch (error: any) {
      logger.error('Fraud prediction request failed', {
        error: error.message,
        service: 'ml-service-client',
      });
      throw error;
    }
  }

  async predictFraud(features: any): Promise<number> {
    try {
      const preprocessedFeatures = this.preprocessFeatures(features);
      const payload: MLPredictionRequest = {
        features: preprocessedFeatures,
        model_name: this.modelName
      };

      const response = await this.predict(payload);
      return response.fraud_probability || this.fallbackPrediction(features);
    } catch (error: any) {
      logger.warn('ML Service prediction failed, using fallback', { error: error.message });
      return this.fallbackPrediction(features);
    }
  }

  async analyzeFraudWithExplanation(features: any): Promise<MLAnalysisResponse> {
    try {
      const preprocessedFeatures = this.preprocessFeatures(features);
      const payload: MLPredictionRequest = {
        features: preprocessedFeatures,
        model_name: this.modelName,
        include_explanation: true
      };

      const response: AxiosResponse<MLPredictionResponse> = await this.client.post('/analyze', payload);

      return {
        riskScore: response.data.fraud_probability,
        prediction: response.data.prediction || (response.data.fraud_probability > 0.5 ? 'fraud' : 'legitimate'),
        confidence: response.data.confidence || Math.abs(response.data.fraud_probability - 0.5) * 2,
        explanation: {
          riskFactors: response.data.explanation?.risk_factors || this.getFallbackRiskFactors(features),
          featureImportance: response.data.explanation?.feature_importance || {}
        }
      };
    } catch (error: any) {
      logger.warn('ML fraud analysis failed, using fallback', { error: error.message });
      const fallbackScore = this.fallbackPrediction(features);
      
      return {
        riskScore: fallbackScore,
        prediction: fallbackScore > 0.5 ? 'fraud' : 'legitimate',
        confidence: Math.abs(fallbackScore - 0.5) * 2,
        explanation: {
          riskFactors: this.getFallbackRiskFactors(features),
          featureImportance: {}
        }
      };
    }
  }

  async healthCheck(): Promise<MLHealthResponse> {
    try {
      const response: AxiosResponse<MLHealthResponse> = await this.client.get('/health');
      this.lastHealthCheck = new Date();
      this.isHealthy = true;

      logger.info('ML Service health check successful', {
        status: response.data.model_status,
        version: response.data.version,
        service: 'ml-service-client',
      });

      return response.data;
    } catch (error: any) {
      this.isHealthy = false;
      logger.warn('ML Service health check failed', {
        error: error.message,
        consecutiveFailures: this.consecutiveFailures,
        service: 'ml-service-client',
      });
      throw error;
    }
  }

  async getModelStatus(): Promise<MLStatusResponse> {
    try {
      const response: AxiosResponse<MLStatusResponse> = await this.client.get('/model/status');
      return response.data;
    } catch (error: any) {
      logger.error('Failed to get model status:', error);
      throw error;
    }
  }

  async trainModel(): Promise<MLTrainingResponse> {
    try {
      logger.info('Initiating ML model training...', {
        service: 'ml-service-client',
      });

      const response: AxiosResponse<MLTrainingResponse> = await this.client.post('/train');

      if (response.data.status === 'success') {
        logger.info('ML model training completed successfully', {
          accuracy: response.data.metrics?.accuracy,
          version: response.data.model_version,
          service: 'ml-service-client',
        });
      } else {
        logger.error('ML model training failed', {
          message: response.data.message,
          service: 'ml-service-client',
        });
      }

      return response.data;
    } catch (error: any) {
      logger.error('ML model training request failed:', error);
      throw error;
    }
  }

  async retrainModel(force: boolean = true): Promise<MLTrainingResponse> {
    try {
      logger.info('Initiating ML model retraining...', {
        force,
        service: 'ml-service-client',
      });

      const response: AxiosResponse<MLTrainingResponse> = await this.client.post('/retrain', { force });
      return response.data;
    } catch (error: any) {
      logger.error('ML model retraining failed:', error);
      throw error;
    }
  }

  async retrain(modelType: string = 'fraud-detection'): Promise<boolean> {
    try {
      logger.info('Initiating ML model retraining by type...', {
        modelType,
        service: 'ml-service-client',
      });

      const response: AxiosResponse<MLTrainingResponse> = await this.client.post('/retrain', { 
        modelType,
        model_name: this.modelName
      });
      
      return response.data.status === 'success';
    } catch (error: any) {
      logger.error('ML model retraining by type failed:', error);
      return false;
    }
  }

  getStatus() {
    return {
      serviceUrl: this.baseUrl,
      isHealthy: this.isHealthy,
      lastHealthCheck: this.lastHealthCheck,
      consecutiveFailures: this.consecutiveFailures,
      modelName: this.modelName
    };
  }

  private preprocessFeatures(features: any): number[] {
    const featureVector = [
      this.normalizeValue(features.amount || 0, 0, 10000),
      (features.hourOfDay || 12) / 24,
      (features.dayOfWeek || 3) / 7,
      features.merchantRiskScore || 0.3,
      this.normalizeValue(features.accountAge || 365, 0, 3650),
      this.normalizeValue(features.transactionCount1h || 1, 0, 20),
      this.normalizeValue(features.transactionCount24h || 5, 0, 100),
      this.normalizeValue(features.avgTransactionAmount || 500, 0, 5000),
      features.locationRiskScore || 0.2,
      features.deviceRiskScore || 0.3,
      this.normalizeValue(features.timeSinceLastTransaction || 3600, 0, 86400),
      this.encodePaymentMethod(features.paymentMethod || 'card'),
      features.ipReputationScore || 0.8,
      features.behavioralAnomalyScore || 0.2,
      features.crossBorderTransaction ? 1 : 0
    ];

    return featureVector.map(f => isNaN(f) ? 0 : f);
  }

  private normalizeValue(value: number, min: number, max: number): number {
    if (max === min) return 0;
    return Math.max(0, Math.min(1, (value - min) / (max - min)));
  }

  private encodePaymentMethod(method: string): number {
    const methodMap: Record<string, number> = {
      'card': 0.3,
      'bank_transfer': 0.2,
      'digital_wallet': 0.4,
      'crypto': 0.9,
      'cash': 0.1,
      'unknown': 0.5
    };
    
    return methodMap[method.toLowerCase()] || 0.5;
  }

  private fallbackPrediction(features: any): number {
    let riskScore = 0.1;
    
    if (features.velocityScore > 0.8) riskScore += 0.4;
    else if (features.velocityScore > 0.6) riskScore += 0.2;
    else if (features.velocityScore > 0.4) riskScore += 0.1;
    
    if (features.deviceConsistency < 0.2) riskScore += 0.3;
    else if (features.deviceConsistency < 0.5) riskScore += 0.15;
    
    if (features.locationConsistency < 0.1) riskScore += 0.3;
    else if (features.locationConsistency < 0.3) riskScore += 0.15;
    
    if (features.isHighValueTransaction) riskScore += 0.1;
    if (features.amount > 5000) riskScore += 0.1;
    
    if (features.isNewMerchant && features.amount > 1000) riskScore += 0.15;
    if (features.merchantRiskScore > 0.7) riskScore += 0.1;
    if (features.previousFraudCount > 0) riskScore += 0.2;
    
    if (features.hourOfDay < 6 || features.hourOfDay > 23) riskScore += 0.05;
    
    return Math.min(Math.max(riskScore, 0), 1.0);
  }

  private getFallbackRiskFactors(features: any): string[] {
    const factors: string[] = [];
    
    if (features.velocityScore > 0.6) factors.push('High transaction velocity');
    if (features.deviceConsistency < 0.5) factors.push('Unknown or suspicious device');
    if (features.locationConsistency < 0.3) factors.push('Unusual location');
    if (features.isHighValueTransaction) factors.push('High value transaction');
    if (features.isNewMerchant) factors.push('New merchant');
    if (features.merchantRiskScore > 0.7) factors.push('High-risk merchant');
    if (features.previousFraudCount > 0) factors.push('Previous fraud history');
    
    return factors.length > 0 ? factors : ['No specific risk factors identified'];
  }
}

export const mlService = new MLService();