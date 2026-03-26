import { Request, Response, NextFunction } from 'express';
import { db } from '../config/firebase';
import { AuthService } from '../services/AuthService';
import { sendSuccess, sendError, sendPaginated } from '../utils/response';
import { logger } from '../utils/logger';
import { FraudAlert } from '../types';

interface AuthRequest extends Request {
  user?: { uid: string; email: string };
}

export class FraudController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  getFraudAlerts = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) return sendError(res, 'Authentication required', 401);

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const status = req.query.status as string;
      const severity = req.query.severity as string;

      let query = db.collection('fraudAlerts').where('userId', '==', req.user.uid);
      if (status) query = query.where('status', '==', status);
      if (severity) query = query.where('severity', '==', severity);

      const totalSnapshot = await query.get();
      const total = totalSnapshot.size;
      const offset = (page - 1) * limit;

      const alertsSnapshot = await query.orderBy('createdAt', 'desc').offset(offset).limit(limit).get();
      const alerts = alertsSnapshot.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) => doc.data());

      sendPaginated(res, alerts, page, limit, total);
    } catch (error) {
      next(error);
    }
  };

  investigateAlert = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) return sendError(res, 'Authentication required', 401);

      const { id } = req.params;
      const { investigationNotes } = req.body;

      const alertRef = db.collection('fraudAlerts').doc(id);
      const alert = await alertRef.get();

      if (!alert.exists) return sendError(res, 'Alert not found', 404);

      const alertData = alert.data() as FraudAlert;
      if (alertData.userId !== req.user.uid) return sendError(res, 'Access denied', 403);

      await alertRef.update({
        status: 'investigating',
        assignedTo: req.user.uid,
        investigationNotes,
        updatedAt: new Date(),
      });

      logger.info('Fraud alert investigation started', {
        alertId: id, userId: req.user.uid, alertType: alertData.alertType,
      });

      sendSuccess(res, null, 'Investigation started successfully');
    } catch (error) {
      next(error);
    }
  };

  resolveAlert = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) return sendError(res, 'Authentication required', 401);

      const { id } = req.params;
      const { resolution, resolutionNotes } = req.body;

      const alertRef = db.collection('fraudAlerts').doc(id);
      const alert = await alertRef.get();

      if (!alert.exists) return sendError(res, 'Alert not found', 404);

      const alertData = alert.data() as FraudAlert;
      if (alertData.userId !== req.user.uid) return sendError(res, 'Access denied', 403);

      await alertRef.update({
        status: 'resolved',
        resolution: {
          outcome: resolution,
          notes: resolutionNotes,
          resolvedBy: req.user.uid,
          resolvedAt: new Date(),
        },
        resolvedAt: new Date(),
      });

      if (resolution === 'confirmed_fraud') {
        const user = await this.authService.getUserById(req.user.uid);
        if (user) {
          await db.collection('users').doc(req.user.uid).update({ riskLevel: 'high' });
        }
      }

      logger.info('Fraud alert resolved', {
        alertId: id, userId: req.user.uid, resolution, alertType: alertData.alertType,
      });

      sendSuccess(res, null, 'Alert resolved successfully');
    } catch (error) {
      next(error);
    }
  };

  getFraudPatterns = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) return sendError(res, 'Authentication required', 401);

      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const alertsSnapshot = await db.collection('fraudAlerts')
        .where('userId', '==', req.user.uid)
        .where('createdAt', '>=', thirtyDaysAgo)
        .get();

      const alerts = alertsSnapshot.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) => doc.data());

      const patterns = {
        totalAlerts: alerts.length,
        alertTypes: this.groupBy(alerts, 'alertType'),
        severityDistribution: this.groupBy(alerts, 'severity'),
        statusDistribution: this.groupBy(alerts, 'status'),
        timePattern: this.analyzeTimePatterns(alerts),
        riskScoreDistribution: this.analyzeRiskScoreDistribution(alerts),
      };

      sendSuccess(res, patterns);
    } catch (error) {
      next(error);
    }
  };

  generateFraudReport = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) return sendError(res, 'Authentication required', 401);

      const { startDate, endDate } = req.query;
      const start = startDate
        ? new Date(startDate as string)
        : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
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

      const alerts = alertsSnapshot.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) => doc.data());
      const transactions = transactionsSnapshot.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) => doc.data());

      const report = {
        period: { startDate: start, endDate: end },
        summary: {
          totalTransactions: transactions.length,
          totalAlerts: alerts.length,
          fraudCases: alerts.filter((a: Record<string, unknown>) => (a.resolution as Record<string, unknown>)?.outcome === 'confirmed_fraud').length,
          falsePositives: alerts.filter((a: Record<string, unknown>) => (a.resolution as Record<string, unknown>)?.outcome === 'false_positive').length,
          averageRiskScore: transactions.reduce((sum: number, t: Record<string, unknown>) => sum + ((t.riskScore as number) || 0), 0) / (transactions.length || 1),
          accuracy: this.calculateAccuracy(alerts),
        },
        trends: {
          dailyAlertCounts: this.getDailyAlertCounts(alerts, start, end),
          riskScoreTrend: this.getRiskScoreTrend(transactions),
          alertTypeBreakdown: this.groupBy(alerts, 'alertType'),
        },
      };

      logger.info('Fraud report generated', { userId: req.user.uid, alertCount: alerts.length });
      sendSuccess(res, report);
    } catch (error) {
      next(error);
    }
  };

  private groupBy(array: Record<string, unknown>[], key: string): Record<string, number> {
    return array.reduce((result: Record<string, number>, item) => {
      const group = item[key] as string;
      result[group] = (result[group] || 0) + 1;
      return result;
    }, {});
  }

  private analyzeTimePatterns(alerts: Record<string, unknown>[]) {
    const hourCounts = new Array(24).fill(0);
    const dayOfWeekCounts = new Array(7).fill(0);

    alerts.forEach((alert) => {
      const raw = alert.createdAt as { toDate?: () => Date } | string;
      const date = typeof raw === 'object' && raw.toDate ? raw.toDate() : new Date(raw as string);
      hourCounts[date.getHours()]++;
      dayOfWeekCounts[date.getDay()]++;
    });

    return { hourlyDistribution: hourCounts, weeklyDistribution: dayOfWeekCounts };
  }

  private analyzeRiskScoreDistribution(alerts: Record<string, unknown>[]) {
    const ranges: Record<string, number> = {
      'low (0-0.3)': 0, 'medium (0.3-0.7)': 0, 'high (0.7-1.0)': 0,
    };
    alerts.forEach((alert) => {
      const score = alert.riskScore as number;
      if (score <= 0.3) ranges['low (0-0.3)']++;
      else if (score <= 0.7) ranges['medium (0.3-0.7)']++;
      else ranges['high (0.7-1.0)']++;
    });
    return ranges;
  }

  private calculateAccuracy(alerts: Record<string, unknown>[]) {
    const resolved = alerts.filter((a) => a.status === 'resolved' && a.resolution);
    if (resolved.length === 0) return 0;
    const correct = resolved.filter((a) => {
      const outcome = (a.resolution as Record<string, unknown>)?.outcome as string;
      const score = a.riskScore as number;
      return (score > 0.7 && outcome === 'confirmed_fraud') || (score <= 0.7 && outcome === 'false_positive');
    });
    return (correct.length / resolved.length) * 100;
  }

  private getDailyAlertCounts(alerts: Record<string, unknown>[], startDate: Date, endDate: Date) {
    const dayCount = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const dailyCounts = new Array(dayCount).fill(0);
    alerts.forEach((alert) => {
      const raw = alert.createdAt as { toDate?: () => Date } | string;
      const alertDate = typeof raw === 'object' && raw.toDate ? raw.toDate() : new Date(raw as string);
      const dayIndex = Math.floor((alertDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      if (dayIndex >= 0 && dayIndex < dayCount) dailyCounts[dayIndex]++;
    });
    return dailyCounts;
  }

  private getRiskScoreTrend(transactions: Record<string, unknown>[]) {
    return transactions
      .sort((a, b) => new Date(a.timestamp as string).getTime() - new Date(b.timestamp as string).getTime())
      .map((t) => ({ date: t.timestamp, riskScore: (t.riskScore as number) || 0 }));
  }
}