// C:\Users\aanus\Downloads\AutheTrack\AutheTrack\server\src\routes\integrationRoutes.ts
import { Router, Request, Response } from "express";

const router = Router();

// Webhook for external system integration
router.post("/webhook", (req: Request, res: Response) => {
  const data = req.body;
  res.json({ message: "Webhook received successfully", data });
});

// Fetch ML model predictions for testing
router.get("/ml-test", (_req: Request, res: Response) => {
  res.json({ prediction: "Legitimate", confidence: 0.92 });
});

export default router;