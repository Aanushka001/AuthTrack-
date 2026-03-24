import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';

const router = Router();

const fraudCases: Array<{
  id: string;
  transactionId: string;
  status: string;
  reason: string;
  reportedAt: string;
  reportedBy?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  investigationNotes?: string;
}> = [
  {
    id: '1',
    transactionId: 'TXN001',
    status: 'Investigating',
    reason: 'Suspicious payment pattern',
    reportedAt: new Date().toISOString(),
    severity: 'high',
  },
  {
    id: '2',
    transactionId: 'TXN002',
    status: 'Confirmed Fraud',
    reason: 'Unauthorized transaction',
    reportedAt: new Date().toISOString(),
    severity: 'critical',
  },
];

const meta = (req: Request) => ({
  timestamp: new Date().toISOString(),
  requestId: (req.headers['x-request-id'] as string) || uuidv4(),
  version: 'v1',
});

router.post('/report', (req: Request, res: Response) => {
  try {
    const { transactionId, reason, severity = 'medium', description } = req.body;

    if (!transactionId || !reason) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_REQUIRED_FIELDS', message: 'Transaction ID and reason are required' },
        meta: meta(req),
      });
    }

    if (fraudCases.find((c) => c.transactionId === transactionId)) {
      return res.status(409).json({
        success: false,
        error: { code: 'CASE_ALREADY_EXISTS', message: 'Fraud case already exists for this transaction' },
        meta: meta(req),
      });
    }

    const newCase = {
      id: uuidv4(),
      transactionId,
      status: 'Reported',
      reason,
      severity,
      reportedAt: new Date().toISOString(),
      reportedBy: (req as any).user?.id || 'anonymous',
      investigationNotes: description || '',
    };

    fraudCases.push(newCase);

    return res.status(201).json({ success: true, data: newCase, meta: meta(req) });
  } catch (error) {
    logger.error('Fraud report error:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'REPORT_FAILED', message: 'Failed to report fraud case' },
      meta: meta(req),
    });
  }
});

router.get('/cases', (req: Request, res: Response) => {
  try {
    const { status, severity, page = 1, limit = 20, sortBy = 'reportedAt', sortOrder = 'desc' } = req.query;

    let filtered = [...fraudCases];

    if (status) filtered = filtered.filter((c) => c.status.toLowerCase() === (status as string).toLowerCase());
    if (severity) filtered = filtered.filter((c) => c.severity === severity);

    filtered.sort((a, b) => {
      const av = (a as any)[sortBy as string];
      const bv = (b as any)[sortBy as string];
      return sortOrder === 'desc' ? (bv > av ? 1 : -1) : av > bv ? 1 : -1;
    });

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const startIndex = (pageNum - 1) * limitNum;
    const paginatedCases = filtered.slice(startIndex, startIndex + limitNum);
    const totalPages = Math.ceil(filtered.length / limitNum);

    return res.json({
      success: true,
      data: {
        cases: paginatedCases,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: filtered.length,
          pages: totalPages,
          hasNext: pageNum < totalPages,
          hasPrev: pageNum > 1,
        },
      },
      meta: meta(req),
    });
  } catch (error) {
    logger.error('Get fraud cases error:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'FETCH_FAILED', message: 'Failed to retrieve fraud cases' },
      meta: meta(req),
    });
  }
});

router.get('/cases/:id', (req: Request, res: Response) => {
  const fraudCase = fraudCases.find((c) => c.id === req.params.id);
  if (!fraudCase) {
    return res.status(404).json({
      success: false,
      error: { code: 'CASE_NOT_FOUND', message: 'Fraud case not found' },
      meta: meta(req),
    });
  }
  return res.json({ success: true, data: fraudCase, meta: meta(req) });
});

router.put('/cases/:id/status', (req: Request, res: Response) => {
  const validStatuses = ['Reported', 'Investigating', 'Confirmed Fraud', 'False Positive', 'Resolved'];
  const { status, notes } = req.body;

  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_STATUS', message: `Status must be one of: ${validStatuses.join(', ')}` },
      meta: meta(req),
    });
  }

  const idx = fraudCases.findIndex((c) => c.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({
      success: false,
      error: { code: 'CASE_NOT_FOUND', message: 'Fraud case not found' },
      meta: meta(req),
    });
  }

  fraudCases[idx] = { ...fraudCases[idx], status, investigationNotes: notes || fraudCases[idx].investigationNotes };
  return res.json({ success: true, data: fraudCases[idx], meta: meta(req) });
});

router.get('/stats', (req: Request, res: Response) => {
  const statusCounts = fraudCases.reduce((acc, c) => { acc[c.status] = (acc[c.status] || 0) + 1; return acc; }, {} as Record<string, number>);
  const severityCounts = fraudCases.reduce((acc, c) => { acc[c.severity] = (acc[c.severity] || 0) + 1; return acc; }, {} as Record<string, number>);
  const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const recentCases = fraudCases.filter((c) => new Date(c.reportedAt) > last30Days).length;

  return res.json({
    success: true,
    data: {
      totalCases: fraudCases.length,
      recentCases,
      statusBreakdown: statusCounts,
      severityBreakdown: severityCounts,
      resolutionRate: fraudCases.length > 0
        ? (((statusCounts['Resolved'] || 0) + (statusCounts['False Positive'] || 0)) / fraudCases.length * 100).toFixed(2)
        : '0.00',
    },
    meta: meta(req),
  });
});

router.delete('/cases/:id', (req: Request, res: Response) => {
  const idx = fraudCases.findIndex((c) => c.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({
      success: false,
      error: { code: 'CASE_NOT_FOUND', message: 'Fraud case not found' },
      meta: meta(req),
    });
  }
  const deleted = fraudCases.splice(idx, 1)[0];
  return res.json({ success: true, data: { message: 'Fraud case deleted', deletedCase: deleted }, meta: meta(req) });
});

export default router;