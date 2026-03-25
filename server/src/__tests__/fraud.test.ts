import request from 'supertest';
import express from 'express';
import fraudRoutes from '../routes/fraudRoutes';
import { errorHandler } from '../middleware/errorMiddleware';

const app = express();
app.use(express.json());
app.use('/api/fraud', fraudRoutes);
app.use(errorHandler);

describe('GET /api/fraud/stats', () => {
  it('returns fraud statistics', async () => {
    const res = await request(app).get('/api/fraud/stats');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.totalCases).toBeDefined();
    expect(res.body.data.severityBreakdown).toBeDefined();
  });
});

describe('GET /api/fraud/cases', () => {
  it('returns paginated fraud cases', async () => {
    const res = await request(app).get('/api/fraud/cases');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.cases)).toBe(true);
    expect(res.body.data.pagination).toBeDefined();
  });

  it('filters by status', async () => {
    const res = await request(app).get('/api/fraud/cases?status=Investigating');
    expect(res.status).toBe(200);
    res.body.data.cases.forEach((c: any) => {
      expect(c.status.toLowerCase()).toBe('investigating');
    });
  });

  it('filters by severity', async () => {
    const res = await request(app).get('/api/fraud/cases?severity=high');
    expect(res.status).toBe(200);
    res.body.data.cases.forEach((c: any) => {
      expect(c.severity).toBe('high');
    });
  });
});

describe('POST /api/fraud/report', () => {
  it('returns 400 when required fields missing', async () => {
    const res = await request(app)
      .post('/api/fraud/report')
      .send({ reason: 'Suspicious' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('MISSING_REQUIRED_FIELDS');
  });

  it('creates a new fraud case', async () => {
    const res = await request(app)
      .post('/api/fraud/report')
      .send({ transactionId: `TXN-NEW-${Date.now()}`, reason: 'Unusual pattern', severity: 'medium' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBeDefined();
    expect(res.body.data.status).toBe('Reported');
  });

  it('returns 409 when case already exists for transaction', async () => {
    const res = await request(app)
      .post('/api/fraud/report')
      .send({ transactionId: 'TXN001', reason: 'Duplicate' });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('CASE_ALREADY_EXISTS');
  });
});

describe('GET /api/fraud/cases/:id', () => {
  it('returns 404 for non-existent case', async () => {
    const res = await request(app).get('/api/fraud/cases/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('CASE_NOT_FOUND');
  });

  it('returns case for valid id', async () => {
    const res = await request(app).get('/api/fraud/cases/1');
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe('1');
  });
});

describe('PUT /api/fraud/cases/:id/status', () => {
  it('returns 400 for invalid status', async () => {
    const res = await request(app)
      .put('/api/fraud/cases/1/status')
      .send({ status: 'InvalidStatus' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_STATUS');
  });

  it('updates case status successfully', async () => {
    const res = await request(app)
      .put('/api/fraud/cases/1/status')
      .send({ status: 'Resolved', notes: 'Confirmed false positive' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('Resolved');
  });
});