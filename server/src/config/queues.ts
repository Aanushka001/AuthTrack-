// ### server/src/config/queues.ts

import Queue from 'bull';
import { logger } from '../utils/logger';
import { MLService } from '../services/MLService';
import { FraudAnalysisService } from '../services/FraudAnalysisService';

export let fraudAnalysisQueue: Queue.Queue;
export let modelTrainingQueue: Queue.Queue;
export let notificationQueue: Queue.Queue;

export async function initializeQueues(): Promise<void> {
  try {
    const redisConfig = {
      redis: {
        port: 6379,
        host: 'localhost'
      }
    };

    fraudAnalysisQueue = new Queue('fraud analysis', redisConfig);
    modelTrainingQueue = new Queue('model training', redisConfig);
    notificationQueue = new Queue('notifications', redisConfig);

    setupProcessors();
    setupEventHandlers();

    logger.info('Queues initialized successfully');
  } catch (error) {
    logger.error('Queue initialization failed:', error);
    throw error;
  }
}

function setupProcessors(): void {
  // Fraud analysis processor
  fraudAnalysisQueue.process('analyze-transaction', 5, async (job) => {
    const { transactionId, transactionData, userId, deviceFingerprint } = job.data;
    const fraudService = new FraudAnalysisService();

    try {
      const result = await fraudService.analyzeTransaction(transactionData, userId, deviceFingerprint);
      logger.info(`Transaction analysis completed for ${transactionId}`);
      return result;
    } catch (error) {
      logger.error(`Transaction analysis failed for ${transactionId}:`, error);
      throw error;
    }
  });

  // Model training processor
  modelTrainingQueue.process('retrain-model', 1, async (job) => {
    const { modelType } = job.data;
    const mlService = new MLService();

    try {
      const success = await mlService.retrain(modelType);
      if (success) {
        logger.info(`Model retraining completed for ${modelType}`);
      } else {
        throw new Error(`Model retraining failed for ${modelType}`);
      }
    } catch (error) {
      logger.error(`Model retraining failed for ${modelType}:`, error);
      throw error;
    }
  });

  // Notification processor
  notificationQueue.process('send-alert', 10, async (job) => {
    const { alertData } = job.data;

    try {
      // TODO: Implement actual notification sending logic
      logger.info(`Alert notification sent for ${alertData.transactionId}`);

      // Future: email, SMS, push notifications
      // await emailService.sendAlert(alertData);
      // await smsService.sendAlert(alertData);
      // await pushNotificationService.sendAlert(alertData);

    } catch (error) {
      logger.error(`Alert notification failed:`, error);
      throw error;
    }
  });
}

function setupEventHandlers(): void {
  fraudAnalysisQueue.on('completed', (job) => {
    logger.info(`Fraud analysis job ${job.id} completed`);
  });

  fraudAnalysisQueue.on('failed', (job, err) => {
    logger.error(`Fraud analysis job ${job.id} failed:`, err);
  });

  modelTrainingQueue.on('completed', (job) => {
    logger.info(`Model training job ${job.id} completed`);
  });

  modelTrainingQueue.on('failed', (job, err) => {
    logger.error(`Model training job ${job.id} failed:`, err);
  });

  notificationQueue.on('completed', (job) => {
    logger.info(`Notification job ${job.id} completed`);
  });

  notificationQueue.on('failed', (job, err) => {
    logger.error(`Notification job ${job.id} failed:`, err);
  });
}
