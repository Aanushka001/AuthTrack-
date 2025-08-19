import { Router } from 'express';
import { transactionController } from '../controllers/transactionController';
import { authMiddleware, adminMiddleware, requireRole } from '../middleware/authMiddleware';

const router = Router();

// Health check endpoint
router.get('/health', (_req, res) => {
  res.json({
    success: true,
    service: 'Transaction Service',
    status: 'operational',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Transaction analysis endpoint
router.post(
  '/analyze',
  authMiddleware,
  transactionController.analyzeTransaction
);

// Get all transactions with filtering
router.get('/', authMiddleware, transactionController.getTransactions);

// Get single transaction by ID
router.get('/:id', authMiddleware, transactionController.getTransaction);

// Update transaction status
router.put(
  '/:id/status',
  authMiddleware,
  transactionController.updateTransactionStatus
);

// Bulk review transactions - requires admin or reviewer role
router.post(
  '/bulk-review',
  authMiddleware,
  requireRole(['admin', 'reviewer']),
  transactionController.bulkReviewTransactions
);

// Export transactions - admin only
router.get(
  '/export/data',
  authMiddleware,
  adminMiddleware,
  transactionController.exportTransactions
);

// Get transaction statistics - admin only
router.get(
  '/stats/overview',
  authMiddleware,
  adminMiddleware,
  transactionController.getTransactionStats
);

// Get user transaction summary
router.get(
  '/user/:userId/summary',
  authMiddleware,
  transactionController.getUserTransactionSummary
);

// Get realtime transaction feed - admin only
router.get(
  '/feed/realtime',
  authMiddleware,
  adminMiddleware,
  transactionController.getRealtimeTransactionFeed
);

// Search transactions
router.post(
  '/search',
  authMiddleware,
  transactionController.searchTransactions
);

// Flag transaction as suspicious - requires reviewer role
router.post(
  '/:id/flag',
  authMiddleware,
  requireRole(['admin', 'reviewer']),
  transactionController.flagTransaction
);

// Approve/reject transaction - requires reviewer role
router.put(
  '/:id/review',
  authMiddleware,
  requireRole(['admin', 'reviewer']),
  transactionController.reviewTransaction
);

// Get transaction patterns - admin only
router.get(
  '/patterns/analysis',
  authMiddleware,
  adminMiddleware,
  transactionController.getTransactionPatterns
);

export default router;