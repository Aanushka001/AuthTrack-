
import { Request, Response, NextFunction } from 'express';
import { db } from '../config/firebase';
import { NotificationService } from '../services/NotificationService';
import { AuthService } from '../services/AuthService';
import { sendSuccess, sendError, sendPaginated } from '../utils/response';
import { logger } from '../utils/logger';
import { FraudAlert } from '../types';

interface AuthRequest extends Request {
  user?: {
    uid: string;
    email: string;
  };
}

export class FraudController {
  private notificationService: NotificationService;
  private authService: AuthService;

  constructor() {
    this.notificationService = new NotificationService();
    this.authService = new AuthService();
  }

  getFraudAlerts = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return sendError(res, 'Authentication required', 401);
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const status = req.query.status as string;
      const severity = req.query.severity as string;

      let query = db.collection('fraudAlerts').where('userId', '==', req.user.uid);

      if (status) {
        query = query.where('status', '==', status);
      }

      if (severity) {
        query = query.where('severity', '==', severity);
      }

      const totalSnapshot = await query.get();
      const total = totalSnapshot.size;

      const offset = (page - 1) * limit;
      const alertsSnapshot = await query
        .orderBy('createdAt', 'desc')
        .offset(offset)
        .limit(limit)
        .get();

      const alerts = alertsSnapshot.docs.map(doc => doc.data());

      sendPaginated(res, alerts, page, limit, total);
    } catch (error) {
      next(error);
    }
  };

  investigateAlert = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return sendError(res, 'Authentication required', 401);
      }

      const { id } = req.params;
      const { investigationNotes } = req.body;

      const alertRef = db.collection('fraudAlerts').doc(id);
      const alert = await alertRef.get();

      if (!alert.exists) {
        return sendError(res, 'Alert not found', 404);
      }

      const alertData = alert.data() as FraudAlert;

      if (alertData.userId !== req.user.uid) {
        return sendError(res, 'Access denied', 403);
      }

      await alertRef.update({
        status: 'investigating',
        assignedTo: req.user.uid,
        investigationNotes,
        updatedAt: new Date()
      });

      logger.info('Fraud alert investigation started', {
        alertId: id,
        userId: req.user.uid,
        alertType: alertData.alertType
      });

      sendSuccess(res, null, 'Investigation started successfully');
    } catch (error) {
      next(error);
    }
  };

  resolveAlert = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return sendError(res, 'Authentication required', 401);
      }

      const { id } = req.params;
      const { resolution, resolutionNotes } = req.body;

      const alertRef = db.collection('fraudAlerts').doc(id);
      const alert = await alertRef.get();

      if (!alert.exists) {
        return sendError(res, 'Alert not found', 404);
      }

      const alertData = alert.data() as FraudAlert;

      if (alertData.userId !== req.user.uid) {
        return sendError(res, 'Access denied', 403);
      }

      await alertRef.update({
        status: 'resolved',
        resolution: {
          outcome: resolution,
          notes: resolutionNotes,
          resolvedBy: req.user.uid,
          resolvedAt: new Date()
        },
        resolvedAt: new Date()
      });

      if (resolution === 'confirmed_fraud') {
        const user = await this.authService.getUserById(req.user.uid);
        if (user) {
          await db.collection('users').doc(req.user.uid).update({
            riskLevel: 'high'
          });
        }
      }

      logger.info('Fraud alert resolved', {
        alertId: id,
        userId: req.user.uid,
        resolution,
        alertType: alertData.alertType
      });

      sendSuccess(res, null, 'Alert resolved successfully');
    } catch (error) {
      next(error);
    }
  };

  getFraudPatterns = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return sendError(res, 'Authentication required', 401);
      }

      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const alertsSnapshot = await db.collection('fraudAlerts')
        .where('userId', '==', req.user.uid)
        .where('createdAt', '>=', thirtyDaysAgo)
        .get();

      const alerts = alertsSnapshot.docs.map(doc => doc.data());

      const patterns = {
        totalAlerts: alerts.length,
        alertTypes: this.groupBy(alerts, 'alertType'),
        severityDistribution: this.groupBy(alerts, 'severity'),
        statusDistribution: this.groupBy(alerts, 'status'),
        timePattern: this.analyzeTimePatterns(alerts),
        riskScoreDistribution: this.analyzeRiskScoreDistribution(alerts)
      };

      sendSuccess(res, patterns);
    } catch (error) {
      next(error);
    }
  };

  generateFraudReport = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return sendError(res, 'Authentication required', 401);
      }

      const { startDate, endDate } = req.query;
      const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate as string) : new Date();

      const alertsSnapshot = await db.collection('fraudAlerts')
        .where('userId', '==', req.user.uid)
        .where('createdAt', '>=', start)
        .where('createdAt', '<=', end)
        .get();

      const transactionsSnapshot = await db.collection('transactions')
        .where('userId', '==', req.user.uid)
        .where('timestamp', '>=', start)
        .where('timestamp', '<=', end)
        .get();

      const alerts = alertsSnapshot.docs.map(doc => doc.data());
      const transactions = transactionsSnapshot.docs.map(doc => doc.data());

      const report = {
        period: {
          startDate: start,
          endDate: end
        },
        summary: {
          totalTransactions: transactions.length,
          totalAlerts: alerts.length,
          fraudCases: alerts.filter(a => a.resolution?.outcome === 'confirmed_fraud').length,
          falsePositives: alerts.filter(a => a.resolution?.outcome === 'false_positive').length,
          averageRiskScore: transactions.reduce((sum, t) => sum + (t.riskScore || 0), 0) / transactions.length,
          accuracy: this.calculateAccuracy(alerts)
        },
        trends: {
          dailyAlertCounts: this.getDailyAlertCounts(alerts, start, end),
          riskScoreTrend: this.getRiskScoreTrend(transactions),
          alertTypeBreakdown: this.groupBy(alerts, 'alertType')
        }
      };

      logger.info('Fraud report generated', {
        userId: req.user.uid,
        period: `${start.toISOString()} to ${end.toISOString()}`,
        alertCount: alerts.length
      });

      sendSuccess(res, report);
    } catch (error) {
      next(error);
    }
  };

  private groupBy(array: any[], key: string) {
    return array.reduce((result, item) => {
      const group = item[key];
      result[group] = (result[group] || 0) + 1;
      return result;
    }, {});
  }

  private analyzeTimePatterns(alerts: any[]) {
    const hourCounts = new Array(24).fill(0);
    const dayOfWeekCounts = new Array(7).fill(0);

    alerts.forEach(alert => {
      const date = alert.createdAt.toDate ? alert.createdAt.toDate() : new Date(alert.createdAt);
      hourCounts[date.getHours()]++;
      dayOfWeekCounts[date.getDay()]++;
    });

    return {
      hourlyDistribution: hourCounts,
      weeklyDistribution: dayOfWeekCounts
    };
  }

  private analyzeRiskScoreDistribution(alerts: any[]) {
    const ranges = {
      'low (0-0.3)': 0,
      'medium (0.3-0.7)': 0,
      'high (0.7-1.0)': 0
    };

    alerts.forEach(alert => {
      if (alert.riskScore <= 0.3) ranges['low (0-0.3)']++;
      else if (alert.riskScore <= 0.7) ranges['medium (0.3-0.7)']++;
      else ranges['high (0.7-1.0)']++;
    });

    return ranges;
  }

  private calculateAccuracy(alerts: any[]) {
    const resolvedAlerts = alerts.filter(a => a.status === 'resolved' && a.resolution);
    if (resolvedAlerts.length === 0) return 0;

    const correctPredictions = resolvedAlerts.filter(a => 
      (a.riskScore > 0.7 && a.resolution.outcome === 'confirmed_fraud') ||
      (a.riskScore <= 0.7 && a.resolution.outcome === 'false_positive')
    );

    return (correctPredictions.length / resolvedAlerts.length) * 100;
  }

  private getDailyAlertCounts(alerts: any[], startDate: Date, endDate: Date) {
    const dayCount = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const dailyCounts = new Array(dayCount).fill(0);

    alerts.forEach(alert => {
      const alertDate = alert.createdAt.toDate ? alert.createdAt.toDate() : new Date(alert.createdAt);
      const dayIndex = Math.floor((alertDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      if (dayIndex >= 0 && dayIndex < dayCount) {
        dailyCounts[dayIndex]++;
      }
    });

    return dailyCounts;
  }

  private getRiskScoreTrend(transactions: any[]) {
    return transactions
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .map(t => ({
        date: t.timestamp,
        riskScore: t.riskScore || 0
      }));
  }
}