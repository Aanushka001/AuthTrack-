import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { redisClient } from '../config/redis';

export const createRateLimit = (windowMs: number, max: number, message?: string) =>
  rateLimit({
    store: new RedisStore({
      sendCommand: (...args: string[]) => redisClient.call(...args),
    }),
    windowMs,
    max,
    message: message || 'Too many requests from this IP',
    standardHeaders: true,
    legacyHeaders: false,
  });

export const authRateLimit = createRateLimit(15 * 60 * 1000, 5, 'Too many authentication attempts');
export const apiRateLimit = createRateLimit(15 * 60 * 1000, 100, 'Too many API requests');
export const fraudAnalysisRateLimit = createRateLimit(60 * 1000, 10, 'Too many fraud analysis requests');