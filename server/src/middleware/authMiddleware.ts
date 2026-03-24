import { Request, Response, NextFunction } from 'express';
import { auth } from '../config/firebase';
import { AppError } from '../utils/AppError';

export interface AuthRequest extends Request {
  user?: {
    uid: string;
    email: string;
    role?: string;
  };
}

export const authMiddleware = async (req: AuthRequest, _res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return next(new AppError('No token provided', 401));

    const decoded = await auth.verifyIdToken(token);
    req.user = { uid: decoded.uid, email: decoded.email || '' };
    next();
  } catch {
    next(new AppError('Invalid token', 401));
  }
};

export const adminMiddleware = async (req: AuthRequest, _res: Response, next: NextFunction) => {
  try {
    if (!req.user) return next(new AppError('User not authenticated', 401));

    const userDoc = await req.app.get('db').collection('users').doc(req.user.uid).get();
    const userData = userDoc.data();

    if (!userData || userData.role !== 'admin') {
      return next(new AppError('Admin access required', 403));
    }

    req.user.role = userData.role;
    next();
  } catch {
    next(new AppError('Authorization failed', 403));
  }
};

export const requireRole = (roles: string[]) => {
  return async (req: AuthRequest, _res: Response, next: NextFunction) => {
    try {
      if (!req.user) return next(new AppError('User not authenticated', 401));

      const userDoc = await req.app.get('db').collection('users').doc(req.user.uid).get();
      const userData = userDoc.data();

      if (!userData || !roles.includes(userData.role)) {
        return next(new AppError('Insufficient permissions', 403));
      }

      req.user.role = userData.role;
      next();
    } catch {
      next(new AppError('Authorization failed', 403));
    }
  };
};