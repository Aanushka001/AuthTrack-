import { Request, Response, NextFunction } from 'express';
import { FraudAnalysisService } from '../services/FraudAnalysisService';
import { RiskAssessmentService } from '../services/RiskAssessmentService';
import { NotificationService } from '../services/NotificationService';
import { databaseService } from '../config/database';
import { sendSuccess, sendError, sendPaginated } from '../utils/response';
import { generateDeviceFingerprint } from '../utils/deviceFingerprint';
import { logger } from '../utils/logger';
import { Transaction } from '../types';

interface AuthRequest extends Request {
  user?: { uid: string; email: string };
}

export class TransactionController {
  private fraudAnalysisService: FraudAnalysisService;
  private riskAssessmentService: RiskAssessmentService;
  private notificationService: NotificationService;

  constructor() {
    this.fraudAnalysisService = new FraudAnalysisService();
    this.riskAssessmentService = new RiskAssessmentService();
    this.notificationService = new NotificationService();
  }

  analyzeTransaction = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) return sendError(res, 'Authentication required', 401);

      const deviceFingerprint = generateDeviceFingerprint(req);
      const transactionData = {
        ...req.body,
        userId: req.user.uid,
        id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
        deviceFingerprint,
        ipAddress: req.ip,
      };

      const analysis = await this.fraudAnalysisService.analyzeTransaction(
        transactionData, req.user.uid, deviceFingerprint
      );

      const transaction: Transaction = {
        ...transactionData,
        transactionId: transactionData.id,
        riskScore: analysis.riskScore,
        fraudPrediction: analysis.fraudPrediction,
        confidence: analysis.confidence,
        status: analysis.riskScore > 0.7 ? 'declined' : 'approved',
        features: analysis.features,
        auditTrail: [{
          action: 'analyzed',
          timestamp: new Date(),
          userId: req.user.uid,
          details: 'Fraud analysis completed',
        }],
      };

      await databaseService.create('transactions', { ...transaction, id: transaction.id });

      if (analysis.alerts?.length) {
        for (const alert of analysis.alerts) {
          await databaseService.create('fraudAlerts', { ...alert, id: alert.id });
        }
      }

      await this.riskAssessmentService.updateUserRiskLevel(req.user.uid);

      logger.info('Transaction analyzed', {
        transactionId: transaction.id,
        userId: req.user.uid,
        riskScore: analysis.riskScore,
        prediction: analysis.fraudPrediction,
      });

      if (analysis.riskScore > 0.7 && req.user.email) {
        await this.notificationService.sendFraudAlertByTransaction(req.user.email, transaction);
      }

      sendSuccess(res, {
        transaction: {
          id: transaction.id,
          riskScore: analysis.riskScore,
          fraudPrediction: analysis.fraudPrediction,
          confidence: analysis.confidence,
          status: transaction.status,
        },
        alerts: analysis.alerts || [],
      });
    } catch (error) {
      next(error);
    }
  };

  getTransactions = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) return sendError(res, 'Authentication required', 401);

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const status = req.query.status as string;

      let transactions = await databaseService.query<Transaction>(
        'transactions', 'userId', '==', req.user.uid
      );

      if (status) transactions = transactions.filter((t) => t.status === status);

      const total = transactions.length;
      const startIndex = (page - 1) * limit;
      const paginatedTransactions = transactions
      .sort((a, b) => {
  const getTime = (t: Date | FirebaseFirestore.Timestamp) =>
    t instanceof Date ? t.getTime() : t.toDate().getTime();

  return getTime(b.timestamp) - getTime(a.timestamp);
})
        .slice(startIndex, startIndex + limit);

      sendPaginated(res, paginatedTransactions, page, limit, total);
    } catch (error) {
      next(error);
    }
  };

  getTransaction = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) return sendError(res, 'Authentication required', 401);

      const { id } = req.params;
      const transaction = await databaseService.get<Transaction>('transactions', id);

      if (!transaction) return sendError(res, 'Transaction not found', 404);
      if (transaction.userId !== req.user.uid) return sendError(res, 'Access denied', 403);

      const alerts = await databaseService.query('fraudAlerts', 'transactionId', '==', id);
      sendSuccess(res, { transaction, alerts });
    } catch (error) {
      next(error);
    }
  };

  updateTransactionStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) return sendError(res, 'Authentication required', 401);

      const { id } = req.params;
      const { status, reason } = req.body;

      const transaction = await databaseService.get<Transaction>('transactions', id);
      if (!transaction) return sendError(res, 'Transaction not found', 404);
      if (transaction.userId !== req.user.uid) return sendError(res, 'Access denied', 403);

      const auditEntry = {
        action: `status_changed_to_${status}`,
        timestamp: new Date(),
        userId: req.user.uid,
        details: reason || 'Status updated by user',
      };

      await databaseService.update('transactions', id, {
        status,
        auditTrail: [...(transaction.auditTrail || []), auditEntry],
      });

      logger.info('Transaction status updated', {
        transactionId: id, userId: req.user.uid, newStatus: status,
      });

      if (req.user.email) {
        await this.notificationService.sendTransactionStatusUpdate(req.user.email, {
          ...transaction, status,
        });
      }

      sendSuccess(res, { status }, 'Transaction status updated successfully');
    } catch (error) {
      next(error);
    }
  };

  bulkReviewTransactions = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) return sendError(res, 'Authentication required', 401);
      sendSuccess(res, { message: 'Bulk review endpoint' });
    } catch (error) {
      next(error);
    }
  };

  exportTransactions = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) return sendError(res, 'Authentication required', 401);
      sendSuccess(res, { message: 'Export transactions endpoint' });
    } catch (error) {
      next(error);
    }
  };

  getTransactionStats = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) return sendError(res, 'Authentication required', 401);
      sendSuccess(res, { message: 'Transaction stats endpoint' });
    } catch (error) {
      next(error);
    }
  };

  getUserTransactionSummary = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) return sendError(res, 'Authentication required', 401);
      sendSuccess(res, { message: 'User transaction summary endpoint' });
    } catch (error) {
      next(error);
    }
  };

  getRealtimeTransactionFeed = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) return sendError(res, 'Authentication required', 401);
      sendSuccess(res, { message: 'Realtime transaction feed endpoint' });
    } catch (error) {
      next(error);
    }
  };

  searchTransactions = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) return sendError(res, 'Authentication required', 401);
      sendSuccess(res, { message: 'Search transactions endpoint' });
    } catch (error) {
      next(error);
    }
  };

  flagTransaction = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) return sendError(res, 'Authentication required', 401);
      sendSuccess(res, { message: 'Flag transaction endpoint' });
    } catch (error) {
      next(error);
    }
  };

  reviewTransaction = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) return sendError(res, 'Authentication required', 401);
      sendSuccess(res, { message: 'Review transaction endpoint' });
    } catch (error) {
      next(error);
    }
  };

  getTransactionPatterns = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) return sendError(res, 'Authentication required', 401);
      sendSuccess(res, { message: 'Transaction patterns endpoint' });
    } catch (error) {
      next(error);
    }
  };
}

export const transactionController = new TransactionController();