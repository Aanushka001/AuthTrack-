import request from 'supertest';
import express from 'express';
import { errorHandler } from '../middleware/errorMiddleware';

// Mock auth so all routes are accessible
jest.mock('../config/firebase', () => ({
  auth: {
    verifyIdToken: jest.fn().mockResolvedValue({ uid: 'test-uid', email: 'test@test.com' }),
  },
  db: null,
}));

jest.mock('../middleware/authMiddleware', () => ({
  authMiddleware: (req: any, _res: any, next: any) => {
    req.user = { uid: 'test-uid', email: 'test@test.com' };
    next();
  },
  adminMiddleware: (_req: any, _res: any, next: any) => next(),
  requireRole: () => (_req: any, _res: any, next: any) => next(),
}));

jest.mock('../config/database', () => ({
  databaseService: {
    create: jest.fn().mockResolvedValue({ id: 'txn-1' }),
    get: jest.fn().mockResolvedValue(null),
    query: jest.fn().mockResolvedValue([]),
    update: jest.fn().mockResolvedValue({}),
    batchWrite: jest.fn().mockResolvedValue({}),
  },
}));

jest.mock('../services/FraudAnalysisService', () => ({
  FraudAnalysisService: jest.fn().mockImplementation(() => ({
    analyzeTransaction: jest.fn().mockResolvedValue({
      riskScore: 0.2,
      fraudPrediction: false,
      confidence: 0.8,
      features: {},
      alerts: [],
    }),
  })),
}));

jest.mock('../services/RiskAssessmentService', () => ({
  RiskAssessmentService: jest.fn().mockImplementation(() => ({
    updateUserRiskLevel: jest.fn().mockResolvedValue({}),
  })),
}));

jest.mock('../services/NotificationService', () => ({
  NotificationService: jest.fn().mockImplementation(() => ({
    sendFraudAlertByTransaction: jest.fn().mockResolvedValue({}),
    sendTransactionStatusUpdate: jest.fn().mockResolvedValue({}),
  })),
}));

jest.mock('../utils/deviceFingerprint', () => ({
  generateDeviceFingerprint: jest.fn().mockReturnValue('fp-abc123'),
}));

import transactionRoutes from '../routes/transactionRoutes';
const app = express();
app.use(express.json());
app.use('/api/transactions', transactionRoutes);
app.use(errorHandler);

describe('GET /api/transactions/health', () => {
  it('returns 200 with service status', async () => {
    const res = await request(app).get('/api/transactions/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.service).toBe('Transaction Service');
  });
});

describe('GET /api/transactions', () => {
  it('returns paginated transaction list', async () => {
    const res = await request(app)
      .get('/api/transactions')
      .set('Authorization', 'Bearer mock-token');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('accepts page and limit query params', async () => {
    const res = await request(app)
      .get('/api/transactions?page=2&limit=5')
      .set('Authorization', 'Bearer mock-token');

    expect(res.status).toBe(200);
    expect(res.body.pagination).toBeDefined();
  });
});

describe('POST /api/transactions/analyze', () => {
  it('returns risk score and fraud prediction', async () => {
    const res = await request(app)
      .post('/api/transactions/analyze')
      .set('Authorization', 'Bearer mock-token')
      .send({
        amount: 150,
        currency: 'USD',
        merchantId: 'merchant-1',
        location: 'New York',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.transaction.riskScore).toBeDefined();
    expect(res.body.data.transaction.fraudPrediction).toBe(false);
    expect(res.body.data.transaction.status).toBe('approved');
  });

  it('declines transaction when risk score > 0.7', async () => {
    const { FraudAnalysisService } = require('../services/FraudAnalysisService');
    FraudAnalysisService.mockImplementationOnce(() => ({
      analyzeTransaction: jest.fn().mockResolvedValue({
        riskScore: 0.85,
        fraudPrediction: true,
        confidence: 0.9,
        features: {},
        alerts: [],
      }),
    }));

    const res = await request(app)
      .post('/api/transactions/analyze')
      .set('Authorization', 'Bearer mock-token')
      .send({ amount: 9999, currency: 'USD' });

    expect(res.status).toBe(200);
    expect(res.body.data.transaction.status).toBe('declined');
  });
});

describe('GET /api/transactions/:id', () => {
  it('returns 404 when transaction not found', async () => {
    const res = await request(app)
      .get('/api/transactions/nonexistent-id')
      .set('Authorization', 'Bearer mock-token');

    expect(res.status).toBe(404);
  });
});