
// ### server/src/controllers/authController.ts
import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/AuthService';
import { NotificationService } from '../services/NotificationService';
import { sendSuccess, sendError } from '../utils/response';
import { generateDeviceFingerprint, extractDeviceInfo } from '../utils/deviceFingerprint';
import { logger } from '../utils/logger';

interface AuthRequest extends Request {
  user?: {
    uid: string;
    email: string;
  };
}

export class AuthController {
  private authService: AuthService;
  private notificationService: NotificationService;

  constructor() {
    this.authService = new AuthService();
    this.notificationService = new NotificationService();
  }

  register = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password, firstName, lastName } = req.body;
      
      const user = await this.authService.createUser(
        { email, password, firstName, lastName },
        req
      );

      await this.notificationService.sendWelcomeEmail(user);

      logger.info('User registered successfully', { userId: user.id, email: user.email });
      sendSuccess(res, { user: { ...user, password: undefined } }, 'User registered successfully', 201);
    } catch (error) {
      next(error);
    }
  };

  login = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return sendError(res, 'Authentication required', 401);
      }

      const user = await this.authService.getUserById(req.user.uid);
      if (!user) {
        return sendError(res, 'User not found', 404);
      }

      if (!user.isActive) {
        return sendError(res, 'Account is deactivated', 403);
      }

      const deviceFingerprint = generateDeviceFingerprint(req);
      await this.authService.updateLastLogin(req.user.uid, deviceFingerprint);

      const deviceInfo = extractDeviceInfo(req);
      
      logger.info('User logged in successfully', { 
        userId: user.id, 
        email: user.email,
        deviceFingerprint 
      });

      sendSuccess(res, {
        user: { ...user },
        deviceFingerprint,
        deviceInfo
      }, 'Login successful');
    } catch (error) {
      next(error);
    }
  };

  getProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return sendError(res, 'Authentication required', 401);
      }

      const user = await this.authService.getUserById(req.user.uid);
      if (!user) {
        return sendError(res, 'User not found', 404);
      }

      sendSuccess(res, user);
    } catch (error) {
      next(error);
    }
  };

  updateProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return sendError(res, 'Authentication required', 401);
      }

      const { firstName, lastName, alertSettings } = req.body;
      const allowedUpdates = { firstName, lastName, alertSettings };
      
      const updatedUser = await this.authService.updateUserProfile(
        req.user.uid, 
        allowedUpdates
      );

      logger.info('User profile updated', { userId: req.user.uid });
      sendSuccess(res, updatedUser, 'Profile updated successfully');
    } catch (error) {
      next(error);
    }
  };

  logout = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (req.user) {
        logger.info('User logged out', { userId: req.user.uid });
      }
      
      sendSuccess(res, null, 'Logout successful');
    } catch (error) {
      next(error);
    }
  };
}
