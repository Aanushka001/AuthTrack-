// server/src/middleware/errorMiddleware.ts

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

interface ErrorWithStatus extends Error {
  statusCode?: number;
}

/**
 * Middleware for handling 404 Not Found errors
 */
export const notFound = (req: Request, res: Response): void => {
  const message = `Not Found - ${req.originalUrl}`;
  logger.warn(message, { method: req.method, url: req.originalUrl });

  res.status(404).json({
    success: false,
    error: message,
  });
};

/**
 * Global error-handling middleware
 */
export const errorHandler = (
  err: ErrorWithStatus,
  req: Request,
  res: Response,
  _next: NextFunction // underscore prevents TS unused variable warning
): void => {
  const statusCode = err.statusCode && err.statusCode >= 100 && err.statusCode < 600
    ? err.statusCode
    : 500;

  const message = err.message || 'Internal Server Error';

  logger.error('Unhandled Error', {
    method: req.method,
    url: req.originalUrl,
    statusCode,
    message,
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
  });

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
};
