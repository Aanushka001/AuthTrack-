import { Router, Response } from 'express';
import { transactionController } from '../controllers/transactionController';
import { authMiddleware, adminMiddleware, requireRole } from '../middleware/authMiddleware';

const router = Router();

router.get('/health', (_req, res: Response) => {
  res.json({
    success: true,
    service: 'Transaction Service',
    status: 'operational',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

router.post('/analyze', authMiddleware, transactionController.analyzeTransaction);
router.get('/', authMiddleware, transactionController.getTransactions);
router.get('/:id', authMiddleware, transactionController.getTransaction);
router.put('/:id/status', authMiddleware, transactionController.updateTransactionStatus);

router.post(
  '/bulk-review',
  authMiddleware,
  requireRole(['admin', 'reviewer']),
  transactionController.bulkReviewTransactions
);

router.get(
  '/export/data',
  authMiddleware,
  adminMiddleware,
  transactionController.exportTransactions
);

router.get(
  '/stats/overview',
  authMiddleware,
  adminMiddleware,
  transactionController.getTransactionStats
);

router.get(
  '/user/:userId/summary',
  authMiddleware,
  transactionController.getUserTransactionSummary
);

router.get(
  '/feed/realtime',
  authMiddleware,
  adminMiddleware,
  transactionController.getRealtimeTransactionFeed
);

router.post('/search', authMiddleware, transactionController.searchTransactions);

router.post(
  '/:id/flag',
  authMiddleware,
  requireRole(['admin', 'reviewer']),
  transactionController.flagTransaction
);

router.put(
  '/:id/review',
  authMiddleware,
  requireRole(['admin', 'reviewer']),
  transactionController.reviewTransaction
);

router.get(
  '/patterns/analysis',
  authMiddleware,
  adminMiddleware,
  transactionController.getTransactionPatterns
);

export default router;