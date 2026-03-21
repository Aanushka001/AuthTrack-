// // C:\Users\aanus\Downloads\AutheTrack\AutheTrack\server\src\controllers\transactionController.ts
// import { Request, Response, NextFunction } from 'express';
// import { FraudAnalysisService } from '../services/FraudAnalysisService';
// import { RiskAssessmentService } from '../services/RiskAssessmentService';
// import { NotificationService } from '../services/NotificationService';
// import { db } from '../config/firebase';
// import { sendSuccess, sendError, sendPaginated } from '../utils/response';
// import { generateDeviceFingerprint } from '../utils/deviceFingerprint';
// import { logger } from '../utils/logger';
// import { Transaction } from '../types';
// import { QueryDocumentSnapshot, DocumentData } from 'firebase-admin/firestore';

// interface AuthRequest extends Request {
//   user?: {
//     uid: string;
//     email: string;
//   };
// }

// export class TransactionController {
//   private fraudAnalysisService: FraudAnalysisService;
//   private riskAssessmentService: RiskAssessmentService;
//   private notificationService: NotificationService;

//   constructor() {
//     this.fraudAnalysisService = new FraudAnalysisService();
//     this.riskAssessmentService = new RiskAssessmentService();
//     this.notificationService = new NotificationService();
//   }

//   analyzeTransaction = async (req: AuthRequest, res: Response, next: NextFunction) => {
//     try {
//       if (!req.user) return sendError(res, 'Authentication required', 401);

//       const deviceFingerprint = generateDeviceFingerprint(req);
//       const transactionData = {
//         ...req.body,
//         userId: req.user.uid,
//         id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
//         timestamp: new Date(),
//         deviceFingerprint,
//         ipAddress: req.ip
//       };

//       const analysis = await this.fraudAnalysisService.analyzeTransaction(
//         transactionData,
//         req.user.uid,
//         deviceFingerprint
//       );

//       const transaction: Transaction = {
//         ...transactionData,
//         transactionId: transactionData.id,
//         riskScore: analysis.riskScore,
//         fraudPrediction: analysis.fraudPrediction,
//         confidence: analysis.confidence,
//         status: analysis.riskScore > 0.7 ? 'declined' : 'approved',
//         features: analysis.features,
//         auditTrail: [{
//           action: 'analyzed',
//           timestamp: new Date(),
//           userId: req.user.uid,
//           details: 'Fraud analysis completed'
//         }]
//       };

//       await db.collection('transactions').doc(transaction.id).set(transaction);

//       if (analysis.alerts?.length) {
//         for (const alert of analysis.alerts) {
//           await db.collection('fraudAlerts').doc(alert.id).set(alert);
//         }
//       }

//       await this.riskAssessmentService.updateUserRiskLevel(req.user.uid);

//       logger.info('Transaction analyzed', {
//         transactionId: transaction.id,
//         userId: req.user.uid,
//         riskScore: analysis.riskScore,
//         prediction: analysis.fraudPrediction
//       });

//       // Send fraud alert notification if risk is high
//       if (analysis.riskScore > 0.7 && req.user.email) {
//         await this.notificationService.sendFraudAlertByTransaction(req.user.email, transaction);
//       }

//       sendSuccess(res, {
//         transaction: {
//           id: transaction.id,
//           riskScore: analysis.riskScore,
//           fraudPrediction: analysis.fraudPrediction,
//           confidence: analysis.confidence,
//           status: transaction.status
//         },
//         alerts: analysis.alerts || []
//       });
//     } catch (error) {
//       next(error);
//     }
//   };

//   getTransactions = async (req: AuthRequest, res: Response, next: NextFunction) => {
//     try {
//       if (!req.user) return sendError(res, 'Authentication required', 401);

//       const page = parseInt(req.query.page as string) || 1;
//       const limit = parseInt(req.query.limit as string) || 20;
//       const status = req.query.status as string;
//       const startDate = req.query.startDate as string;
//       const endDate = req.query.endDate as string;

//       let query = db.collection('transactions').where('userId', '==', req.user.uid);

//       if (status) query = query.where('status', '==', status);
//       if (startDate) query = query.where('timestamp', '>=', new Date(startDate));
//       if (endDate) query = query.where('timestamp', '<=', new Date(endDate));

//       const totalSnapshot = await query.get();
//       const total = totalSnapshot.size;

//       const offset = (page - 1) * limit;
//       const transactionsSnapshot = await query
//         .orderBy('timestamp', 'desc')
//         .offset(offset)
//         .limit(limit)
//         .get();

//       const transactions = transactionsSnapshot.docs.map(
//         (doc: QueryDocumentSnapshot<DocumentData>) => doc.data()
//       );

//       sendPaginated(res, transactions, page, limit, total);
//     } catch (error) {
//       next(error);
//     }
//   };

//   getTransaction = async (req: AuthRequest, res: Response, next: NextFunction) => {
//     try {
//       if (!req.user) return sendError(res, 'Authentication required', 401);

//       const { id } = req.params;
//       const transactionDoc = await db.collection('transactions').doc(id).get();

//       if (!transactionDoc.exists) return sendError(res, 'Transaction not found', 404);

//       const transaction = transactionDoc.data() as Transaction;
//       if (transaction.userId !== req.user.uid) return sendError(res, 'Access denied', 403);

//       const alertsSnapshot = await db.collection('fraudAlerts')
//         .where('transactionId', '==', id)
//         .get();

//       const alerts = alertsSnapshot.docs.map(
//         (doc: QueryDocumentSnapshot<DocumentData>) => doc.data()
//       );

//       sendSuccess(res, { transaction, alerts });
//     } catch (error) {
//       next(error);
//     }
//   };

//   updateTransactionStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
//     try {
//       if (!req.user) return sendError(res, 'Authentication required', 401);

//       const { id } = req.params;
//       const { status, reason } = req.body;

//       const transactionRef = db.collection('transactions').doc(id);
//       const transaction = await transactionRef.get();

//       if (!transaction.exists) return sendError(res, 'Transaction not found', 404);

//       const transactionData = transaction.data() as Transaction;
//       if (transactionData.userId !== req.user.uid) return sendError(res, 'Access denied', 403);

//       const auditEntry = {
//         action: `status_changed_to_${status}`,
//         timestamp: new Date(),
//         userId: req.user.uid,
//         details: reason || 'Status updated by user'
//       };

//       await transactionRef.update({
//         status,
//         auditTrail: [...(transactionData.auditTrail || []), auditEntry]
//       });

//       logger.info('Transaction status updated', {
//         transactionId: id,
//         userId: req.user.uid,
//         newStatus: status,
//         reason
//       });

//       // Notify user about status change
//       if (req.user.email) {
//         await this.notificationService.sendTransactionStatusUpdate(req.user.email, {
//           ...transactionData,
//           status
//         });
//       }

//       sendSuccess(res, { status }, 'Transaction status updated successfully');
//     } catch (error) {
//       next(error);
//     }
//   };

//   bulkReviewTransactions = async (req: AuthRequest, res: Response, next: NextFunction) => {
//     try {
//       if (!req.user) return sendError(res, 'Authentication required', 401);

//       const { transactionIds, status, reason } = req.body;
//       if (!Array.isArray(transactionIds) || !transactionIds.length)
//         return sendError(res, 'Transaction IDs are required', 400);

//       const batch = db.batch();
//       const auditEntry = {
//         action: `bulk_status_changed_to_${status}`,
//         timestamp: new Date(),
//         userId: req.user.uid,
//         details: reason || 'Bulk status update'
//       };

//       for (const transactionId of transactionIds) {
//         const transactionRef = db.collection('transactions').doc(transactionId);
//         const transaction = await transactionRef.get();

//         if (transaction.exists) {
//           const transactionData = transaction.data() as Transaction;
//           if (transactionData.userId === req.user.uid) {
//             batch.update(transactionRef, {
//               status,
//               auditTrail: [...(transactionData.auditTrail || []), auditEntry]
//             });

//             // Notify each transaction update
//             if (req.user.email) {
//               await this.notificationService.sendTransactionStatusUpdate(req.user.email, {
//                 ...transactionData,
//                 status
//               });
//             }
//           }
//         }
//       }

//       await batch.commit();

//       logger.info('Bulk transaction status updated', {
//         userId: req.user.uid,
//         transactionCount: transactionIds.length,
//         newStatus: status
//       });

//       sendSuccess(res, { updatedCount: transactionIds.length, status }, 'Bulk update completed successfully');
//     } catch (error) {
//       next(error);
//     }
//   };

//   exportTransactions = async (req: AuthRequest, res: Response, next: NextFunction) => {
//     try {
//       if (!req.user) return sendError(res, 'Authentication required', 401);

//       const { startDate, endDate, format = 'json' } = req.query;

//       let query = db.collection('transactions').where('userId', '==', req.user.uid);
//       if (startDate) query = query.where('timestamp', '>=', new Date(startDate as string));
//       if (endDate) query = query.where('timestamp', '<=', new Date(endDate as string));

//       const snapshot = await query.orderBy('timestamp', 'desc').get();
//       const transactions = snapshot.docs.map(
//         (doc: QueryDocumentSnapshot<DocumentData>) => doc.data()
//       );

//       if (format === 'csv') {
//         const csvHeader = 'ID,Amount,Currency,Merchant,Timestamp,Status,Risk Score,Fraud Prediction\n';
//         const csvRows = transactions.map(t =>
//           `${t.id},${t.amount},${t.currency},${t.merchantId},${(t.timestamp as any).toDate().toISOString()},${t.status},${t.riskScore},${t.fraudPrediction}`
//         ).join('\n');

//         res.setHeader('Content-Type', 'text/csv');
//         res.setHeader('Content-Disposition', 'attachment; filename=transactions.csv');
//         res.send(csvHeader + csvRows);
//       } else {
//         sendSuccess(res, transactions);
//       }

//       logger.info('Transactions exported', {
//         userId: req.user.uid,
//         count: transactions.length,
//         format
//       });
//     } catch (error) {
//       next(error);
//     }
//   };

//   // Additional stubbed methods (no changes)
//   getTransactionStats = async (req: AuthRequest, res: Response, next: NextFunction) => {
//     try {
//       if (!req.user) return sendError(res, 'Authentication required', 401);
//       sendSuccess(res, { message: 'Transaction stats endpoint' });
//     } catch (error) {
//       next(error);
//     }
//   };

//   getUserTransactionSummary = async (req: AuthRequest, res: Response, next: NextFunction) => {
//     try {
//       if (!req.user) return sendError(res, 'Authentication required', 401);
//       sendSuccess(res, { message: 'User transaction summary endpoint' });
//     } catch (error) {
//       next(error);
//     }
//   };

//   getRealtimeTransactionFeed = async (req: AuthRequest, res: Response, next: NextFunction) => {
//     try {
//       if (!req.user) return sendError(res, 'Authentication required', 401);
//       sendSuccess(res, { message: 'Realtime transaction feed endpoint' });
//     } catch (error) {
//       next(error);
//     }
//   };

//   searchTransactions = async (req: AuthRequest, res: Response, next: NextFunction) => {
//     try {
//       if (!req.user) return sendError(res, 'Authentication required', 401);
//       sendSuccess(res, { message: 'Search transactions endpoint' });
//     } catch (error) {
//       next(error);
//     }
//   };

//   flagTransaction = async (req: AuthRequest, res: Response, next: NextFunction) => {
//     try {
//       if (!req.user) return sendError(res, 'Authentication required', 401);
//       sendSuccess(res, { message: 'Flag transaction endpoint' });
//     } catch (error) {
//       next(error);
//     }
//   };

//   reviewTransaction = async (req: AuthRequest, res: Response, next: NextFunction) => {
//     try {
//       if (!req.user) return sendError(res, 'Authentication required', 401);
//       sendSuccess(res, { message: 'Review transaction endpoint' });
//     } catch (error) {
//       next(error);
//     }
//   };

//   getTransactionPatterns = async (req: AuthRequest, res: Response, next: NextFunction) => {
//     try {
//       if (!req.user) return sendError(res, 'Authentication required', 401);
//       sendSuccess(res, { message: 'Transaction patterns endpoint' });
//     } catch (error) {
//       next(error);
//     }
//   };
// }

// export const transactionController = new TransactionController();

// C:\Users\aanus\Downloads\AutheTrack\AutheTrack\server\src\controllers\transactionController.ts
import { Request, Response, NextFunction } from 'express';
import { FraudAnalysisService } from '../services/FraudAnalysisService';
import { RiskAssessmentService } from '../services/RiskAssessmentService';
import { NotificationService } from '../services/NotificationService';
import { databaseService } from '../config/database'; // Changed: Use databaseService instead of db
import { sendSuccess, sendError, sendPaginated } from '../utils/response';
import { generateDeviceFingerprint } from '../utils/deviceFingerprint';
import { logger } from '../utils/logger';
import { Transaction } from '../types';

interface AuthRequest extends Request {
  user?: {
    uid: string;
    email: string;
  };
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
        ipAddress: req.ip
      };

      const analysis = await this.fraudAnalysisService.analyzeTransaction(
        transactionData,
        req.user.uid,
        deviceFingerprint
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
          details: 'Fraud analysis completed'
        }]
      };

      // Use databaseService instead of direct db access
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
        prediction: analysis.fraudPrediction
      });

      // Send fraud alert notification if risk is high
      if (analysis.riskScore > 0.7 && req.user.email) {
        await this.notificationService.sendFraudAlertByTransaction(req.user.email, transaction);
      }

      sendSuccess(res, {
        transaction: {
          id: transaction.id,
          riskScore: analysis.riskScore,
          fraudPrediction: analysis.fraudPrediction,
          confidence: analysis.confidence,
          status: transaction.status
        },
        alerts: analysis.alerts || []
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

      // Use databaseService query method
      let transactions: Transaction[] = [];
      
      if (status) {
        // Query with multiple conditions - you may need to create a compound query method
        transactions = await databaseService.query<Transaction>('transactions', 'userId', '==', req.user.uid);
        transactions = transactions.filter(t => t.status === status);
      } else {
        transactions = await databaseService.query<Transaction>('transactions', 'userId', '==', req.user.uid);
      }

      // Handle pagination manually for now
      const total = transactions.length;
      const startIndex = (page - 1) * limit;
      const paginatedTransactions = transactions
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
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
        details: reason || 'Status updated by user'
      };

      await databaseService.update('transactions', id, {
        status,
        auditTrail: [...(transaction.auditTrail || []), auditEntry]
      });

      logger.info('Transaction status updated', {
        transactionId: id,
        userId: req.user.uid,
        newStatus: status,
        reason
      });

      // Notify user about status change
      if (req.user.email) {
        await this.notificationService.sendTransactionStatusUpdate(req.user.email, {
          ...transaction,
          status
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

      const { transactionIds, status, reason } = req.body;
      if (!Array.isArray(transactionIds) || !transactionIds.length)
        return sendError(res, 'Transaction IDs are required', 400);

      const auditEntry = {
        action: `bulk_status_changed_to_${status}`,
        timestamp: new Date(),
        userId: req.user.uid,
        details: reason || 'Bulk status update'
      };

      // Prepare batch operations
      const batchOps = [];
      
      for (const transactionId of transactionIds) {
        const transaction = await databaseService.get<Transaction>('transactions', transactionId);
        
        if (transaction && transaction.userId === req.user.uid) {
          batchOps.push({
            type: 'update' as const,
            collection: 'transactions',
            id: transactionId,
            data: {
              status,
              auditTrail: [...(transaction.auditTrail || []), auditEntry]
            }
          });

          // Notify each transaction update
          if (req.user.email) {
            await this.notificationService.sendTransactionStatusUpdate(req.user.email, {
              ...transaction,
              status
            });
          }
        }
      }

      await databaseService.batchWrite(batchOps);

      logger.info('Bulk transaction status updated', {
        userId: req.user.uid,
        transactionCount: batchOps.length,
        newStatus: status
      });

      sendSuccess(res, { updatedCount: batchOps.length, status }, 'Bulk update completed successfully');
    } catch (error) {
      next(error);
    }
  };

  exportTransactions = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) return sendError(res, 'Authentication required', 401);

      const { startDate, endDate, format = 'json' } = req.query;

      let transactions = await databaseService.query<Transaction>('transactions', 'userId', '==', req.user.uid);
      
      // Apply date filtering
      if (startDate) {
        const start = new Date(startDate as string);
        transactions = transactions.filter(t => new Date(t.timestamp) >= start);
      }
      if (endDate) {
        const end = new Date(endDate as string);
        transactions = transactions.filter(t => new Date(t.timestamp) <= end);
      }

      // Sort by timestamp descending
      transactions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      if (format === 'csv') {
        const csvHeader = 'ID,Amount,Currency,Merchant,Timestamp,Status,Risk Score,Fraud Prediction\n';
        const csvRows = transactions.map(t =>
          `${t.id},${t.amount},${t.currency},${t.merchantId},${new Date(t.timestamp).toISOString()},${t.status},${t.riskScore},${t.fraudPrediction}`
        ).join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=transactions.csv');
        res.send(csvHeader + csvRows);
      } else {
        sendSuccess(res, transactions);
      }

      logger.info('Transactions exported', {
        userId: req.user.uid,
        count: transactions.length,
        format
      });
    } catch (error) {
      next(error);
    }
  };

  // Additional stubbed methods (no changes)
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