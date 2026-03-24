import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

router.post('/score', authMiddleware, (req: Request, res: Response) => {
  const { transactionId, amount, deviceFingerprint } = req.body;

  let riskMultiplier = 1;
  if (amount > 1000) riskMultiplier += 0.3;
  if (amount > 5000) riskMultiplier += 0.5;
  if (!deviceFingerprint) riskMultiplier += 0.4;

  const score = Math.min(100, Math.floor(Math.random() * 50 * riskMultiplier));

  res.json({
    success: true,
    data: {
      transactionId,
      riskScore: score,
      riskLevel: score > 70 ? 'HIGH' : score > 40 ? 'MEDIUM' : 'LOW',
      factors: {
        amount: amount > 1000 ? 'High amount detected' : 'Normal amount',
        device: deviceFingerprint ? 'Known device' : 'Unknown device',
      },
    },
    meta: { timestamp: new Date().toISOString(), version: 'v1' },
  });
});

router.get('/profiles/:userId', authMiddleware, (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      userId: req.params.userId,
      currentRiskScore: Math.floor(Math.random() * 100),
      riskLevel: 'MEDIUM',
      behaviorBaseline: {
        avgTransactionAmount: 250,
        typicalHours: [9, 10, 11, 14, 15, 16, 17, 18, 19, 20],
        frequentMerchants: ['Amazon', 'Starbucks', 'Shell'],
      },
      lastUpdated: new Date().toISOString(),
    },
  });
});

router.put('/profiles/:userId', authMiddleware, (req: Request, res: Response) => {
  res.json({
    success: true,
    data: { userId: req.params.userId, ...req.body, lastUpdated: new Date().toISOString() },
  });
});

router.get('/scores/real-time', authMiddleware, (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      userId: req.query.userId,
      currentScore: Math.floor(Math.random() * 100),
      trend: Math.random() > 0.5 ? 'increasing' : 'decreasing',
      lastCalculated: new Date().toISOString(),
    },
  });
});

router.post('/analysis/behavioral', authMiddleware, (req: Request, res: Response) => {
  const { userId, deviceId, transactionPatterns, timePatterns } = req.body;
  let score = Math.floor(Math.random() * 100);
  if (transactionPatterns) score = Math.min(100, score + 10);
  if (deviceId) score = Math.max(0, score - 5);

  const anomalies: string[] = [];
  if (timePatterns?.unusualHours) anomalies.push('Unusual transaction timing');
  if (!deviceId) anomalies.push('Different device fingerprint');

  res.json({
    success: true,
    data: {
      analysisId: `analysis_${Date.now()}`,
      behaviorScore: score,
      anomalies,
      confidence: Math.floor(Math.random() * 40) + 60,
      processedData: { userId: userId || 'anonymous' },
    },
  });
});

router.get('/metrics/dashboard', authMiddleware, (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      metrics: {
        totalTransactions: 15420,
        fraudTransactions: 284,
        detectionAccuracy: 94.8,
        avgResponseTime: 23,
        falsePositiveRate: 2.1,
      },
      charts: {
        hourlyVolume: Array.from({ length: 24 }, () => Math.floor(Math.random() * 500) + 100),
        riskDistribution: { low: 78, medium: 15, high: 7 },
        fraudTrends: Array.from({ length: 7 }, (_, i) => ({
          date: new Date(Date.now() - (6 - i) * 86400000).toISOString().split('T')[0],
          fraudCount: Math.floor(Math.random() * 50) + 10,
          totalTransactions: Math.floor(Math.random() * 1000) + 500,
        })),
      },
      realTimeStats: {
        activeUsers: Math.floor(Math.random() * 1000) + 500,
        transactionsLast24h: Math.floor(Math.random() * 5000) + 2000,
        avgRiskScore: Math.floor(Math.random() * 30) + 35,
        alertsGenerated: Math.floor(Math.random() * 20) + 5,
      },
    },
    meta: { timestamp: new Date().toISOString(), version: 'v1' },
  });
});

export default router;