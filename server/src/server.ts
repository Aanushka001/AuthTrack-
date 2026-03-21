// // // C:\Users\aanus\Downloads\AutheTrack\AutheTrack\server\src\server.ts
// // import dotenv from 'dotenv';

// // // Load environment variables first
// // dotenv.config();

// // import express from 'express';
// // import cors from 'cors';
// // import helmet from 'helmet';
// // import rateLimit from 'express-rate-limit';
// // import { createServer } from 'http';
// // import { Server as SocketIOServer } from 'socket.io';

// // import { initializeDatabase } from './config/database';
// // import { initializeRedis } from './config/redis';
// // import { initializeQueues } from './config/queues';
// // import { setupSwagger } from './config/swagger';
// // import { errorHandler } from './middleware/errorMiddleware';
// // import { logger } from './utils/logger';
// // import { initializeSocketServer } from './websocket/socketServer';

// // import authRoutes from './routes/authRoutes';
// // import transactionRoutes from './routes/transactionRoutes';
// // import riskRoutes from './routes/riskRoutes';
// // import fraudRoutes from './routes/fraudRoutes';
// // import adminRoutes from './routes/adminRoutes';
// // import integrationRoutes from './routes/integrationRoutes';

// // const app = express();
// // const server = createServer(app);
// // const io = new SocketIOServer(server, {
// //   cors: {
// //     origin: process.env.CORS_ORIGIN || "http://localhost:3000",
// //     methods: ["GET", "POST"]
// //   }
// // });

// // const PORT = process.env.PORT || 5000;

// // const limiter = rateLimit({
// //   windowMs: 15 * 60 * 1000,
// //   max: 100,
// //   message: 'Too many requests from this IP, please try again later.'
// // });

// // app.use(helmet());
// // app.use(cors({
// //   origin: process.env.CORS_ORIGIN || "http://localhost:3000",
// //   credentials: true
// // }));
// // app.use(limiter);
// // app.use(express.json({ limit: '10mb' }));
// // app.use(express.urlencoded({ extended: true }));

// // setupSwagger(app);

// // app.use('/api/auth', authRoutes);
// // app.use('/api/transactions', transactionRoutes);
// // app.use('/api/risk', riskRoutes);
// // app.use('/api/fraud', fraudRoutes);
// // app.use('/api/admin', adminRoutes);
// // app.use('/api/integrations', integrationRoutes);

// // app.get('/health', (_req, res) => {
// //   res.json({ status: 'OK', timestamp: new Date().toISOString() });
// // });

// // app.use(errorHandler);

// // async function startServer() {
// //   try {
// //     logger.info('Starting server initialization...');
    
// //     // Log environment variables for debugging (don't log sensitive data)
// //     logger.info('Environment check:', {
// //       nodeEnv: process.env.NODE_ENV,
// //       port: process.env.PORT,
// //       hasFirebaseProjectId: !!process.env.FIREBASE_PROJECT_ID,
// //       hasFirebasePrivateKey: !!process.env.FIREBASE_PRIVATE_KEY,
// //       hasFirebaseClientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
// //       firebaseProjectId: process.env.FIREBASE_PROJECT_ID,
// //       firebaseClientEmail: process.env.FIREBASE_CLIENT_EMAIL,
// //     });

// //     // Initialize database first
// //     logger.info('Initializing database...');
// //     await initializeDatabase();
// //     logger.info('Database initialization completed successfully');

// //     // Initialize other services
// //     logger.info('Initializing Redis...');
// //     try {
// //       await initializeRedis();
// //       logger.info('Redis initialization completed successfully');
// //     } catch (redisError) {
// //       logger.warn('Redis initialization failed, continuing without Redis:', redisError);
// //     }

// //     logger.info('Initializing queues...');
// //     try {
// //       await initializeQueues();
// //       logger.info('Queue initialization completed successfully');
// //     } catch (queueError) {
// //       logger.warn('Queue initialization failed, continuing without queues:', queueError);
// //     }

// //     // Initialize WebSocket server
// //     logger.info('Initializing WebSocket server...');
// //     try {
// //       initializeSocketServer(io);
// //       logger.info('WebSocket server initialized successfully');
// //     } catch (wsError) {
// //       logger.warn('WebSocket server initialization failed, continuing without WebSocket:', wsError);
// //     }

// //     // Start the HTTP server
// //     server.listen(PORT, () => {
// //       logger.info(`Server running on port ${PORT}`);
// //       logger.info('Server initialization completed successfully');
// //       logger.info(`API Base URL: http://localhost:${PORT}/api`);
// //       logger.info(`Health Check: http://localhost:${PORT}/health`);
// //     });

// //   } catch (error) {
// //     logger.error('Failed to start server:', error);
    
// //     // Log more detailed error information
// //     if (error instanceof Error) {
// //       logger.error('Error details:', {
// //         message: error.message,
// //         stack: error.stack,
// //         name: error.name
// //       });
// //     }
    
// //     process.exit(1);
// //   }
// // }

// // // Enhanced error handling
// // process.on('uncaughtException', (error) => {
// //   logger.error('Uncaught Exception:', error);
// //   process.exit(1);
// // });

// // process.on('unhandledRejection', (reason, promise) => {
// //   logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
// //   process.exit(1);
// // });

// // // Add graceful shutdown
// // process.on('SIGTERM', () => {
// //   logger.info('SIGTERM received, shutting down gracefully');
// //   server.close(() => {
// //     logger.info('Process terminated');
// //     process.exit(0);
// //   });
// // });

// // process.on('SIGINT', () => {
// //   logger.info('SIGINT received, shutting down gracefully');
// //   server.close(() => {
// //     logger.info('Process terminated');
// //     process.exit(0);
// //   });
// // });

// // startServer();


// import dotenv from 'dotenv';

// dotenv.config();

// import express from 'express';
// import cors from 'cors';
// import helmet from 'helmet';
// import rateLimit from 'express-rate-limit';
// import { createServer } from 'http';
// import { Server as SocketIOServer } from 'socket.io';

// import { initializeDatabase } from './config/database';
// import { initializeRedis } from './config/redis';
// import { initializeQueues } from './config/queues';
// import { setupSwagger } from './config/swagger';
// import { errorHandler } from './middleware/errorMiddleware';
// import { logger } from './utils/logger';
// import { initializeSocketServer } from './websocket/socketServer';

// import authRoutes from './routes/authRoutes';
// import transactionRoutes from './routes/transactionRoutes';
// import riskRoutes from './routes/riskRoutes';
// import fraudRoutes from './routes/fraudRoutes';
// import adminRoutes from './routes/adminRoutes';
// import integrationRoutes from './routes/integrationRoutes';

// const app = express();
// const server = createServer(app);
// const io = new SocketIOServer(server, {
//   cors: {
//     origin: process.env.CORS_ORIGIN || "http://localhost:3000",
//     methods: ["GET", "POST"]
//   }
// });

// const PORT = process.env.PORT || 3001;

// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000,
//   max: 100,
//   message: 'Too many requests from this IP, please try again later.'
// });

// app.use(helmet());
// app.use(cors({
//   origin: process.env.CORS_ORIGIN || "http://localhost:3000",
//   credentials: true
// }));
// app.use(limiter);
// app.use(express.json({ limit: '10mb' }));
// app.use(express.urlencoded({ extended: true }));

// setupSwagger(app);

// app.get('/', (req, res) => {
//   res.json({
//     service: 'SecureTrace API',
//     version: '1.0.0',
//     status: 'running',
//     timestamp: new Date().toISOString(),
//     endpoints: {
//       health: '/health',
//       api: '/api',
//       documentation: '/api-docs'
//     }
//   });
// });

// app.get('/health', (req, res) => {
//   res.json({ 
//     status: 'OK', 
//     service: 'SecureTrace API',
//     timestamp: new Date().toISOString(),
//     uptime: process.uptime(),
//     memory: process.memoryUsage(),
//     version: '1.0.0'
//   });
// });

// app.get('/api', (req, res) => {
//   res.json({
//     message: 'SecureTrace API v1.0.0',
//     endpoints: {
//       auth: '/api/auth',
//       transactions: '/api/transactions', 
//       risk: '/api/risk',
//       fraud: '/api/fraud',
//       admin: '/api/admin',
//       integrations: '/api/integrations'
//     },
//     timestamp: new Date().toISOString()
//   });
// });

// app.get('/api/dashboard', async (req, res) => {
//   try {
//     const dashboardData = {
//       totalTransactions: 15420,
//       fraudDetected: 89,
//       falsePositives: 12,
//       accuracy: 94.2,
//       recentTransactions: [
//         {
//           id: '1',
//           userId: 'user1',
//           amount: 250.50,
//           currency: 'USD',
//           location: 'New York',
//           device: 'iPhone',
//           timestamp: new Date().toISOString(),
//           riskScore: 0.85,
//           status: 'declined' as const,
//           fraudPrediction: true,
//           flags: ['High velocity', 'New device']
//         },
//         {
//           id: '2',
//           userId: 'user2',
//           amount: 89.99,
//           currency: 'USD',
//           location: 'California',
//           device: 'Android',
//           timestamp: new Date().toISOString(),
//           riskScore: 0.15,
//           status: 'approved' as const,
//           fraudPrediction: false,
//           flags: []
//         }
//       ],
//       alerts: [
//         {
//           id: '1',
//           type: 'fraud' as const,
//           severity: 'high' as const,
//           message: 'Suspicious transaction pattern detected',
//           timestamp: new Date().toISOString(),
//           userId: 'user1',
//           transactionId: '1',
//           status: 'new' as const
//         }
//       ],
//       riskDistribution: [
//         { level: 'low', count: 12450 },
//         { level: 'medium', count: 2881 },
//         { level: 'high', count: 89 }
//       ]
//     };
    
//     res.json(dashboardData);
//   } catch (error) {
//     logger.error('Dashboard data fetch failed:', error);
//     res.status(500).json({ error: 'Failed to fetch dashboard data' });
//   }
// });

// app.use('/api/auth', authRoutes);
// app.use('/api/transactions', transactionRoutes);
// app.use('/api/risk', riskRoutes);
// app.use('/api/fraud', fraudRoutes);
// app.use('/api/admin', adminRoutes);
// app.use('/api/integrations', integrationRoutes);

// app.use('*', (req, res) => {
//   res.status(404).json({ 
//     error: 'Endpoint not found',
//     path: req.originalUrl,
//     method: req.method,
//     timestamp: new Date().toISOString()
//   });
// });

// app.use(errorHandler);

// async function startServer() {
//   try {
//     logger.info('Starting server initialization...');
    
//     logger.info('Environment check:', {
//       nodeEnv: process.env.NODE_ENV,
//       port: process.env.PORT,
//       hasFirebaseProjectId: !!process.env.FIREBASE_PROJECT_ID,
//       hasFirebasePrivateKey: !!process.env.FIREBASE_PRIVATE_KEY,
//       hasFirebaseClientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
//       firebaseProjectId: process.env.FIREBASE_PROJECT_ID,
//       firebaseClientEmail: process.env.FIREBASE_CLIENT_EMAIL,
//     });

//     logger.info('Initializing database...');
//     await initializeDatabase();
//     logger.info('Database initialization completed successfully');

//     logger.info('Initializing Redis...');
//     try {
//       await initializeRedis();
//       logger.info('Redis initialization completed successfully');
//     } catch (redisError) {
//       logger.warn('Redis initialization failed, continuing without Redis:', redisError);
//     }

//     logger.info('Initializing queues...');
//     try {
//       await initializeQueues();
//       logger.info('Queue initialization completed successfully');
//     } catch (queueError) {
//       logger.warn('Queue initialization failed, continuing without queues:', queueError);
//     }

//     logger.info('Initializing WebSocket server...');
//     try {
//       initializeSocketServer(io);
//       logger.info('WebSocket server initialized successfully');
//     } catch (wsError) {
//       logger.warn('WebSocket server initialization failed, continuing without WebSocket:', wsError);
//     }

//     server.listen(PORT, () => {
//       logger.info(`Server running on port ${PORT}`);
//       logger.info('Server initialization completed successfully');
//       logger.info(`API Base URL: http://localhost:${PORT}/api`);
//       logger.info(`Health Check: http://localhost:${PORT}/health`);
//     });

//   } catch (error) {
//     logger.error('Failed to start server:', error);
    
//     if (error instanceof Error) {
//       logger.error('Error details:', {
//         message: error.message,
//         stack: error.stack,
//         name: error.name
//       });
//     }
    
//     process.exit(1);
//   }
// }

// process.on('uncaughtException', (error) => {
//   logger.error('Uncaught Exception:', error);
//   process.exit(1);
// });

// process.on('unhandledRejection', (reason, promise) => {
//   logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
//   process.exit(1);
// });

// process.on('SIGTERM', () => {
//   logger.info('SIGTERM received, shutting down gracefully');
//   server.close(() => {
//     logger.info('Process terminated');
//     process.exit(0);
//   });
// });

// process.on('SIGINT', () => {
//   logger.info('SIGINT received, shutting down gracefully');
//   server.close(() => {
//     logger.info('Process terminated');
//     process.exit(0);
//   });
// });

// startServer();


// C:\Users\aanus\Downloads\AutheTrack\AutheTrack\server\src\server.ts
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
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3001;

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.'
});

app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:3000",
  credentials: true
}));
app.use(limiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

setupSwagger(app);

app.get('/', (_req, res) => {
  res.json({
    service: 'SecureTrace API',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/health',
      api: '/api',
      documentation: '/api-docs'
    }
  });
});

app.get('/health', (_req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'SecureTrace API',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: '1.0.0'
  });
});

app.get('/api', (_req, res) => {
  res.json({
    message: 'SecureTrace API v1.0.0',
    endpoints: {
      auth: '/api/auth',
      transactions: '/api/transactions', 
      risk: '/api/risk',
      fraud: '/api/fraud',
      admin: '/api/admin',
      integrations: '/api/integrations'
    },
    timestamp: new Date().toISOString()
  });
});

app.get('/api/dashboard', async (_req, res) => {
  try {
    const dashboardData = {
      totalTransactions: 15420,
      fraudDetected: 89,
      falsePositives: 12,
      accuracy: 94.2,
      recentTransactions: [
        {
          id: '1',
          userId: 'user1',
          amount: 250.50,
          currency: 'USD',
          location: 'New York',
          device: 'iPhone',
          timestamp: new Date().toISOString(),
          riskScore: 0.85,
          status: 'declined' as const,
          fraudPrediction: true,
          flags: ['High velocity', 'New device']
        },
        {
          id: '2',
          userId: 'user2',
          amount: 89.99,
          currency: 'USD',
          location: 'California',
          device: 'Android',
          timestamp: new Date().toISOString(),
          riskScore: 0.15,
          status: 'approved' as const,
          fraudPrediction: false,
          flags: []
        }
      ],
      alerts: [
        {
          id: '1',
          type: 'fraud' as const,
          severity: 'high' as const,
          message: 'Suspicious transaction pattern detected',
          timestamp: new Date().toISOString(),
          userId: 'user1',
          transactionId: '1',
          status: 'new' as const
        }
      ],
      riskDistribution: [
        { level: 'low', count: 12450 },
        { level: 'medium', count: 2881 },
        { level: 'high', count: 89 }
      ]
    };
    
    res.json(dashboardData);
  } catch (error) {
    logger.error('Dashboard data fetch failed:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
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
    timestamp: new Date().toISOString()
  });
});

app.use(errorHandler);

async function startServer() {
  try {
    logger.info('Starting server initialization...');
    
    logger.info('Environment check:', {
      nodeEnv: process.env.NODE_ENV,
      port: process.env.PORT,
      hasFirebaseProjectId: !!process.env.FIREBASE_PROJECT_ID,
      hasFirebasePrivateKey: !!process.env.FIREBASE_PRIVATE_KEY,
      hasFirebaseClientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
      firebaseProjectId: process.env.FIREBASE_PROJECT_ID,
      firebaseClientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    });

    logger.info('Initializing database...');
    await initializeDatabase();
    logger.info('Database initialization completed successfully');

    logger.info('Initializing Redis...');
    try {
      await initializeRedis();
      logger.info('Redis initialization completed successfully');
    } catch (redisError) {
      logger.warn('Redis initialization failed, continuing without Redis:', redisError);
    }

    logger.info('Initializing queues...');
    try {
      await initializeQueues();
      logger.info('Queue initialization completed successfully');
    } catch (queueError) {
      logger.warn('Queue initialization failed, continuing without queues:', queueError);
    }

    logger.info('Initializing WebSocket server...');
    try {
      initializeSocketServer(io);
      logger.info('WebSocket server initialized successfully');
    } catch (wsError) {
      logger.warn('WebSocket server initialization failed, continuing without WebSocket:', wsError);
    }

    server.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info('Server initialization completed successfully');
      logger.info(`API Base URL: http://localhost:${PORT}/api`);
      logger.info(`Health Check: http://localhost:${PORT}/health`);
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    
    if (error instanceof Error) {
      logger.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
    }
    
    process.exit(1);
  }
}

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

startServer();
