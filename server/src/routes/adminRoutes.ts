// C:\Users\aanus\Downloads\AutheTrack\AutheTrack\server\src\routes\adminRoutes.ts
import { Router, Request, Response } from "express";
import { authMiddleware, adminMiddleware } from "../middleware/authMiddleware";

const router = Router();

// Get all users - requires admin access
router.get("/users", authMiddleware, adminMiddleware, (_req: Request, res: Response) => {
  res.json([
    { id: 1, email: "user1@example.com", role: "user", status: "active" },
    { id: 2, email: "admin@example.com", role: "admin", status: "active" },
    { id: 3, email: "reviewer@example.com", role: "reviewer", status: "active" },
  ]);
});

// System stats - requires admin access
router.get("/stats", authMiddleware, adminMiddleware, (_req: Request, res: Response) => {
  res.json({
    totalUsers: 50,
    totalTransactions: 200,
    fraudCases: 5,
    pendingReviews: 12,
    systemHealth: "good",
    lastUpdated: new Date().toISOString()
  });
});

// User management endpoints
router.post("/users/:id/status", authMiddleware, adminMiddleware, (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;
  
  res.json({
    success: true,
    message: `User ${id} status updated to ${status}`,
    userId: id,
    newStatus: status
  });
});

// System configuration
router.get("/config", authMiddleware, adminMiddleware, (_req: Request, res: Response) => {
  res.json({
    fraudThreshold: 0.7,
    autoReviewEnabled: true,
    maintenanceMode: false,
    maxTransactionAmount: 10000
  });
});

router.put("/config", authMiddleware, adminMiddleware, (req: Request, res: Response) => {
  const config = req.body;
  
  res.json({
    success: true,
    message: "Configuration updated successfully",
    config
  });
});

export default router;