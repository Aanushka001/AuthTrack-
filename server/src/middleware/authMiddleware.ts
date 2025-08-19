// server/src/middleware/authMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import { auth } from '../config/firebase';
import { AppError } from '../utils/AppError';

interface AuthRequest extends Request {
  user?: {
    uid: string;
    email: string;
    role?: string;
  };
}

// Main authentication middleware
export const authMiddleware = async (req: AuthRequest, _res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return next(new AppError('No token provided', 401));
    }

    const decodedToken = await auth.verifyIdToken(token);
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email || ''
    };

    next();
  } catch (error) {
    next(new AppError('Invalid token', 401));
  }
};

// Legacy authenticate middleware (alias for authMiddleware)
export const authenticate = authMiddleware;

// Admin middleware - checks if user has admin role
export const adminMiddleware = async (req: AuthRequest, _res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return next(new AppError('User not authenticated', 401));
    }

    // Get user data from database to check role
    const userDoc = await req.app.get('db')
      .collection('users')
      .doc(req.user.uid)
      .get();
      
    const userData = userDoc.data();
    
    if (!userData || userData.role !== 'admin') {
      return next(new AppError('Admin access required', 403));
    }
    
    // Add role to user object
    req.user.role = userData.role;
    next();
  } catch (error) {
    next(new AppError('Authorization failed', 403));
  }
};

// Role-based access control middleware
export const requireRole = (roles: string[]) => {
  return async (req: AuthRequest, _res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return next(new AppError('User not authenticated', 401));
      }

      // Get user data from database to check role
      const userDoc = await req.app.get('db')
        .collection('users')
        .doc(req.user.uid)
        .get();
        
      const userData = userDoc.data();

      if (!userData || !roles.includes(userData.role)) {
        return next(new AppError('Insufficient permissions', 403));
      }

      // Add role to user object
      req.user.role = userData.role;
      next();
    } catch (error) {
      next(new AppError('Authorization failed', 403));
    }
  };
};

// Alternative authorize function (similar to requireRole)
export const authorize = (roles: string[]) => {
  return async (req: AuthRequest, _res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return next(new AppError('User not authenticated', 401));
      }

      const userDoc = await req.app.get('db')
        .collection('users')
        .doc(req.user.uid)
        .get();
        
      const userData = userDoc.data();

      if (!userData || !roles.includes(userData.role)) {
        return next(new AppError('Insufficient permissions', 403));
      }

      req.user.role = userData.role;
      next();
    } catch (error) {
      next(new AppError('Authorization failed', 403));
    }
  };
};