// C:\Users\aanus\Downloads\AutheTrack\AutheTrack\server\src\routes\riskRoutes.ts
import { Router, Request, Response } from "express";

const router = Router();

// Risk scoring endpoint
router.post("/score", (req: Request, res: Response) => {
  const { transactionId, amount, deviceFingerprint } = req.body;

  let riskMultiplier = 1;
  if (amount > 1000) riskMultiplier += 0.3;
  if (amount > 5000) riskMultiplier += 0.5;
  if (!deviceFingerprint) riskMultiplier += 0.4;

  const baseScore = Math.floor(Math.random() * 50);
  const score = Math.min(100, Math.floor(baseScore * riskMultiplier));

  res.json({
    success: true,
    data: {
      transactionId,
      riskScore: score,
      riskLevel: score > 70 ? "HIGH" : score > 40 ? "MEDIUM" : "LOW",
      factors: {
        amount: amount > 1000 ? "High amount detected" : "Normal amount",
        device: deviceFingerprint ? "Known device" : "Unknown device",
      },
    },
    meta: {
      timestamp: new Date().toISOString(),
      requestId: `req_${Date.now()}`,
      version: "v1"
    }
  });
});

// Risk profile endpoints
router.get("/profiles/:userId", (req: Request, res: Response) => {
  const { userId } = req.params;
  
  res.json({
    success: true,
    data: {
      userId,
      currentRiskScore: Math.floor(Math.random() * 100),
      riskLevel: "MEDIUM",
      behaviorBaseline: {
        avgTransactionAmount: 250,
        typicalHours: [9, 10, 11, 14, 15, 16, 17, 18, 19, 20],
        frequentMerchants: ["Amazon", "Starbucks", "Shell"]
      },
      lastUpdated: new Date().toISOString()
    }
  });
});

router.put("/profiles/:userId", (req: Request, res: Response) => {
  const { userId } = req.params;
  const profileData = req.body;
  
  res.json({
    success: true,
    data: {
      userId,
      ...profileData,
      lastUpdated: new Date().toISOString()
    }
  });
});

// Real-time risk scoring
router.get("/scores/real-time", (req: Request, res: Response) => {
  const { userId } = req.query;
  
  res.json({
    success: true,
    data: {
      userId,
      currentScore: Math.floor(Math.random() * 100),
      trend: Math.random() > 0.5 ? "increasing" : "decreasing",
      lastCalculated: new Date().toISOString()
    }
  });
});

// Behavioral analysis
router.post("/analysis/behavioral", (req: Request, res: Response) => {
  const { userId, deviceId, transactionPatterns, timePatterns } = req.body;
  
  // Use the behavioral data for analysis
  const baseScore = Math.floor(Math.random() * 100);
  let adjustedScore = baseScore;
  
  // Adjust score based on behavioral data
  if (userId && transactionPatterns) {
    adjustedScore = Math.min(100, baseScore + 10);
  }
  if (deviceId) {
    adjustedScore = Math.max(0, adjustedScore - 5);
  }
  
  const anomalies = [];
  if (timePatterns?.unusualHours) {
    anomalies.push("Unusual transaction timing");
  }
  if (!deviceId || deviceId !== req.body.expectedDeviceId) {
    anomalies.push("Different device fingerprint");
  }
  
  res.json({
    success: true,
    data: {
      analysisId: `analysis_${Date.now()}`,
      behaviorScore: adjustedScore,
      anomalies: anomalies.slice(0, Math.max(1, Math.floor(Math.random() * 3))),
      confidence: Math.floor(Math.random() * 40) + 60,
      processedData: {
        userId: userId || "anonymous",
        patternsAnalyzed: transactionPatterns ? Object.keys(transactionPatterns).length : 0
      }
    }
  });
});

// Dashboard metrics - THIS WAS MISSING AND CAUSING THE 404 ERROR
router.get("/metrics/dashboard", (_req: Request, res: Response) => {
  // Generate mock dashboard metrics
  const mockMetrics = {
    metrics: {
      totalTransactions: 15420,
      fraudTransactions: 284,
      detectionAccuracy: 94.8,
      avgResponseTime: 23,
      falsePositiveRate: 2.1
    },
    charts: {
      hourlyVolume: Array.from({ length: 24 }, () => Math.floor(Math.random() * 500) + 100),
      riskDistribution: {
        low: 78,
        medium: 15,
        high: 7
      },
      fraudTrends: Array.from({ length: 7 }, (_, i) => ({
        date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        fraudCount: Math.floor(Math.random() * 50) + 10,
        totalTransactions: Math.floor(Math.random() * 1000) + 500
      }))
    },
    realTimeStats: {
      activeUsers: Math.floor(Math.random() * 1000) + 500,
      transactionsLast24h: Math.floor(Math.random() * 5000) + 2000,
      avgRiskScore: Math.floor(Math.random() * 30) + 35,
      alertsGenerated: Math.floor(Math.random() * 20) + 5
    }
  };

  res.json({
    success: true,
    data: mockMetrics,
    meta: {
      timestamp: new Date().toISOString(),
      requestId: `req_${Date.now()}`,
      version: "v1"
    }
  });
});

export default router;