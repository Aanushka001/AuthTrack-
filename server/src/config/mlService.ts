// ### server/src/config/mlService.ts
import { logger } from '../utils/logger';

export interface MLServiceConfig {
  serviceUrl: string;
  apiKey: string;
  modelName: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
  healthCheckInterval: number;
  fallbackEnabled: boolean;
}

export class MLServiceConfiguration {
  private static instance: MLServiceConfiguration;
  private config: MLServiceConfig;

  private constructor() {
    this.config = this.loadConfiguration();
    this.validateConfiguration();
  }

  public static getInstance(): MLServiceConfiguration {
    if (!MLServiceConfiguration.instance) {
      MLServiceConfiguration.instance = new MLServiceConfiguration();
    }
    return MLServiceConfiguration.instance;
  }

  private loadConfiguration(): MLServiceConfig {
    return {
      serviceUrl: process.env.ML_SERVICE_URL || 'http://localhost:5001',
      apiKey: process.env.ML_API_KEY || '89a6f454a6455c2a9cc85cee4eda59fe61599c632996e8d23300b63ae3efd97d',
      modelName: process.env.ML_MODEL_NAME || 'fraud-detection-v1',
      timeout: parseInt(process.env.ML_SERVICE_TIMEOUT || '10000', 10),
      retryAttempts: parseInt(process.env.ML_SERVICE_RETRY_ATTEMPTS || '2', 10),
      retryDelay: parseInt(process.env.ML_SERVICE_RETRY_DELAY || '1000', 10),
      healthCheckInterval: parseInt(process.env.ML_HEALTH_CHECK_INTERVAL || '300000', 10),
      fallbackEnabled: process.env.ML_FALLBACK_ENABLED !== 'false'
    };
  }

  private validateConfiguration(): void {
    const errors: string[] = [];

    if (!this.config.serviceUrl) {
      errors.push('ML_SERVICE_URL is required');
    } else {
      try {
        new URL(this.config.serviceUrl);
      } catch {
        errors.push('ML_SERVICE_URL must be a valid URL');
      }
    }

    if (!this.config.apiKey || this.config.apiKey.length < 8) {
      errors.push('ML_API_KEY must be at least 8 characters long');
    }

    if (!this.config.modelName || this.config.modelName.trim().length === 0) {
      errors.push('ML_MODEL_NAME cannot be empty');
    }

    if (this.config.timeout < 1000 || this.config.timeout > 30000) {
      errors.push('ML_SERVICE_TIMEOUT must be between 1000 and 30000 milliseconds');
    }

    if (this.config.retryAttempts < 0 || this.config.retryAttempts > 5) {
      errors.push('ML_SERVICE_RETRY_ATTEMPTS must be between 0 and 5');
    }

    if (errors.length > 0) {
      const errorMessage = `ML Service configuration errors: ${errors.join(', ')}`;
      logger.error(errorMessage);
      throw new Error(errorMessage);
    }

    logger.info('ML Service configuration validated successfully', {
      serviceUrl: this.config.serviceUrl,
      modelName: this.config.modelName,
      timeout: this.config.timeout,
      fallbackEnabled: this.config.fallbackEnabled
    });
  }

  public getConfig(): MLServiceConfig {
    return { ...this.config };
  }

  public isDevelopmentMode(): boolean {
    return this.config.serviceUrl.includes('localhost') || 
           this.config.serviceUrl.includes('127.0.0.1');
  }

  public isProductionReady(): boolean {
    return !this.isDevelopmentMode() && 
           this.config.serviceUrl.startsWith('https://') &&
           this.config.apiKey.length >= 32;
  }

  public updateConfig(updates: Partial<MLServiceConfig>): void {
    this.config = { ...this.config, ...updates };
    this.validateConfiguration();
    logger.info('ML Service configuration updated', updates);
  }
}

export const mlConfig = MLServiceConfiguration.getInstance();

export const getMLServiceUrl = (): string => mlConfig.getConfig().serviceUrl;
export const getMLApiKey = (): string => mlConfig.getConfig().apiKey;
export const getMLModelName = (): string => mlConfig.getConfig().modelName;
export const isMLFallbackEnabled = (): boolean => mlConfig.getConfig().fallbackEnabled;