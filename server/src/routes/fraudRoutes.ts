// // C:\Users\aanus\Downloads\AutheTrack\AutheTrack\server\src\routes\fraudRoutes.ts
// import { Router, Request, Response } from "express";

// const router = Router();

// // Report suspected fraud
// router.post("/report", (req: Request, res: Response) => {
//   const { transactionId, reason } = req.body;
//   res.json({ message: "Fraud reported successfully", transactionId, reason });
// });

// // List fraud cases
// router.get("/cases", (req: Request, res: Response) => {
//   res.json([
//     { id: 1, transactionId: "TXN001", status: "Investigating" },
//     { id: 2, transactionId: "TXN002", status: "Confirmed Fraud" },
//   ]);
// });

// export default router;
import { Router, Request, Response } from "express";
import { v4 as uuidv4 } from 'uuid';

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
    severity: 'high'
  },
  {
    id: '2',
    transactionId: 'TXN002',
    status: 'Confirmed Fraud',
    reason: 'Unauthorized transaction',
    reportedAt: new Date().toISOString(),
    severity: 'critical'
  }
];

router.post("/report", (req: Request, res: Response) => {
  try {
    const { transactionId, reason, severity = 'medium', description } = req.body;

    if (!transactionId || !reason) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_REQUIRED_FIELDS',
          message: 'Transaction ID and reason are required'
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string || uuidv4(),
          version: 'v1'
        }
      });
    }

    const existingCase = fraudCases.find(c => c.transactionId === transactionId);
    if (existingCase) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'CASE_ALREADY_EXISTS',
          message: 'Fraud case already exists for this transaction'
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string || uuidv4(),
          version: 'v1'
        }
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
      investigationNotes: description || ''
    };

    fraudCases.push(newCase);

    return res.status(201).json({
      success: true,
      data: {
        caseId: newCase.id,
        transactionId,
        status: newCase.status,
        reason,
        severity,
        reportedAt: newCase.reportedAt
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string || uuidv4(),
        version: 'v1'
      }
    });
  } catch (error) {
    console.error('Fraud report error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'REPORT_FAILED',
        message: 'Failed to report fraud case'
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string || uuidv4(),
        version: 'v1'
      }
    });
  }
});

router.get("/cases", (req: Request, res: Response) => {
  try {
    const {
      status,
      severity,
      page = 1,
      limit = 20,
      sortBy = 'reportedAt',
      sortOrder = 'desc'
    } = req.query;

    let filteredCases = [...fraudCases];

    if (status) {
      filteredCases = filteredCases.filter(c => 
        c.status.toLowerCase() === (status as string).toLowerCase()
      );
    }

    if (severity) {
      filteredCases = filteredCases.filter(c => 
        c.severity === severity
      );
    }

    filteredCases.sort((a, b) => {
      const aValue = (a as any)[sortBy as string];
      const bValue = (b as any)[sortBy as string];
      
      if (sortOrder === 'desc') {
        return bValue > aValue ? 1 : -1;
      }
      return aValue > bValue ? 1 : -1;
    });

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;

    const paginatedCases = filteredCases.slice(startIndex, endIndex);
    const totalCases = filteredCases.length;
    const totalPages = Math.ceil(totalCases / limitNum);

    return res.json({
      success: true,
      data: {
        cases: paginatedCases,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: totalCases,
          pages: totalPages,
          hasNext: pageNum < totalPages,
          hasPrev: pageNum > 1
        }
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string || uuidv4(),
        version: 'v1'
      }
    });
  } catch (error) {
    console.error('Get fraud cases error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_FAILED',
        message: 'Failed to retrieve fraud cases'
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string || uuidv4(),
        version: 'v1'
      }
    });
  }
});

router.get("/cases/:id", (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const fraudCase = fraudCases.find(c => c.id === id);
    if (!fraudCase) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'CASE_NOT_FOUND',
          message: 'Fraud case not found'
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string || uuidv4(),
          version: 'v1'
        }
      });
    }

    return res.json({
      success: true,
      data: fraudCase,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string || uuidv4(),
        version: 'v1'
      }
    });
  } catch (error) {
    console.error('Get fraud case error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_FAILED',
        message: 'Failed to retrieve fraud case'
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string || uuidv4(),
        version: 'v1'
      }
    });
  }
});

router.put("/cases/:id/status", (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const validStatuses = ['Reported', 'Investigating', 'Confirmed Fraud', 'False Positive', 'Resolved'];
    
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_STATUS',
          message: `Status must be one of: ${validStatuses.join(', ')}`
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string || uuidv4(),
          version: 'v1'
        }
      });
    }

    const caseIndex = fraudCases.findIndex(c => c.id === id);
    if (caseIndex === -1) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'CASE_NOT_FOUND',
          message: 'Fraud case not found'
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string || uuidv4(),
          version: 'v1'
        }
      });
    }

    fraudCases[caseIndex] = {
      ...fraudCases[caseIndex],
      status,
      investigationNotes: notes || fraudCases[caseIndex].investigationNotes
    };

    return res.json({
      success: true,
      data: fraudCases[caseIndex],
      meta: {
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string || uuidv4(),
        version: 'v1'
      }
    });
  } catch (error) {
    console.error('Update fraud case status error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'UPDATE_FAILED',
        message: 'Failed to update fraud case status'
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string || uuidv4(),
        version: 'v1'
      }
    });
  }
});

router.get("/stats", (req: Request, res: Response) => {
  try {
    const totalCases = fraudCases.length;
    const statusCounts = fraudCases.reduce((acc, c) => {
      acc[c.status] = (acc[c.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const severityCounts = fraudCases.reduce((acc, c) => {
      acc[c.severity] = (acc[c.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);

    const recentCases = fraudCases.filter(c => 
      new Date(c.reportedAt) > last30Days
    ).length;

    return res.json({
      success: true,
      data: {
        totalCases,
        recentCases,
        statusBreakdown: statusCounts,
        severityBreakdown: severityCounts,
        averageCasesPerDay: (recentCases / 30).toFixed(2),
        resolutionRate: totalCases > 0 ? 
          (((statusCounts['Resolved'] || 0) + (statusCounts['False Positive'] || 0)) / totalCases * 100).toFixed(2) : 
          '0.00'
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string || uuidv4(),
        version: 'v1'
      }
    });
  } catch (error) {
    console.error('Get fraud stats error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'STATS_FAILED',
        message: 'Failed to retrieve fraud statistics'
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string || uuidv4(),
        version: 'v1'
      }
    });
  }
});

router.delete("/cases/:id", (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const caseIndex = fraudCases.findIndex(c => c.id === id);
    if (caseIndex === -1) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'CASE_NOT_FOUND',
          message: 'Fraud case not found'
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string || uuidv4(),
          version: 'v1'
        }
      });
    }

    const deletedCase = fraudCases.splice(caseIndex, 1)[0];

    return res.json({
      success: true,
      data: {
        message: 'Fraud case deleted successfully',
        deletedCase
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string || uuidv4(),
        version: 'v1'
      }
    });
  } catch (error) {
    console.error('Delete fraud case error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'DELETE_FAILED',
        message: 'Failed to delete fraud case'
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string || uuidv4(),
        version: 'v1'
      }
    });
  }
});

export default router;