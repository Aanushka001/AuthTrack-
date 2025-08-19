// C:\Users\aanus\Downloads\AutheTrack\AutheTrack\server\src\routes\authRoutes.ts
import { Router, Request, Response } from "express";

const router = Router();

router.post("/signup", (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      message: "Email and password are required",
      error: "MISSING_FIELDS"
    });
  }

  console.log(`Registration attempt for email: ${email}, password length: ${password.length}`);
  const userId = `user_${Date.now()}`;

  return res.status(201).json({
    message: "User registered successfully",
    email,
    userId,
    passwordSet: !!password
  });
});

router.post("/login", (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      message: "Email and password are required",
      error: "MISSING_CREDENTIALS"
    });
  }

  console.log(`Login attempt for email: ${email}, password provided: ${!!password}`);
  const isValidCredentials = email.includes("@") && password.length >= 6;

  if (!isValidCredentials) {
    return res.status(401).json({
      message: "Invalid email or password",
      error: "AUTHENTICATION_FAILED"
    });
  }

  return res.json({
    message: "Login successful",
    token: `jwt_token_${Date.now()}`,
    user: {
      email,
      id: `user_${email.split("@")[0]}`,
      lastLogin: new Date().toISOString()
    }
  });
});

// ✅ Fixed: Removed unused req parameter by prefixing with underscore
router.post("/logout", (_req: Request, res: Response) => {
  return res.json({
    message: "User logged out successfully",
    timestamp: new Date().toISOString()
  });
});

export default router;