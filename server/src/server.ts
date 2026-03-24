import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

import { initializeDatabase } from './config/database';
import { initializeRedis } from './config/redis';
import { initializeQueues } from './config/queues';
import { setupSwagger } from './config/swagger';
import { errorHandler } from './middleware/errorMiddleware';
import { logger } from './utils/logger';
import { initializeSocketServer } from './websocket/socketServer';

import authRoutes from './routes/authRoutes';
import transactionRoutes from './routes/transactionRoutes';
import riskRoutes from './routes/riskRoutes';
import fraudRoutes from './routes/fraudRoutes';
import adminRoutes from './routes/adminRoutes';
import integrationRoutes from './routes/integrationRoutes';

const app = express();
const server = createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

const PORT = process.env.PORT || 3001;

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.',
});

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:3000', credentials: true }));
app.use(limiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

setupSwagger(app);

app.get('/health', (_req, res) => {
  res.json({
    status: 'OK',
    service: 'SecureTrace API',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/risk', riskRoutes);
app.use('/api/fraud', fraudRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/integrations', integrationRoutes);

app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString(),
  });
});

app.use(errorHandler);

async function startServer() {
  try {
    logger.info('Starting server...', {
      nodeEnv: process.env.NODE_ENV,
      port: PORT,
      hasFirebaseProjectId: !!process.env.FIREBASE_PROJECT_ID,
      hasFirebasePrivateKey: !!process.env.FIREBASE_PRIVATE_KEY,
      hasFirebaseClientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
    });

    await initializeDatabase();

    try {
      await initializeRedis();
    } catch (e) {
      logger.warn('Redis unavailable, continuing without Redis:', e);
    }

    try {
      await initializeQueues();
    } catch (e) {
      logger.warn('Queues unavailable, continuing without queues:', e);
    }

    try {
      initializeSocketServer(io);
    } catch (e) {
      logger.warn('WebSocket init failed, continuing without WebSocket:', e);
    }

    server.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`API: http://localhost:${PORT}/api`);
      logger.info(`Health: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection:', reason);
  process.exit(1);
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => process.exit(0));
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => process.exit(0));
});

startServer();