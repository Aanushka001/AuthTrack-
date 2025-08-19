import { Server as SocketIOServer, Socket } from 'socket.io';
import { logger } from '../utils/logger';
import jwt from 'jsonwebtoken';
import { database } from '../config/database';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: string;
}

interface User {
  id: string;
  email: string;
  role: string;
  isActive: boolean;
}

interface JwtPayload {
  userId: string;
  iat?: number;
  exp?: number;
}

interface Transaction {
  id: string;
  timestamp: Date;
  fraudPrediction: string;
  riskScore: number;
}

interface FraudAlert {
  id: string;
  severity: string;
  status: string;
}

interface DashboardMetrics {
  timestamp: Date;
  metrics: {
    totalTransactions: number;
    fraudTransactions: number;
    highRiskTransactions: number;
    activeAlerts: number;
    avgRiskScore: number;
    detectionAccuracy: number;
    avgResponseTime: number;
  };
  charts: {
    hourlyVolume: number[];
    riskDistribution: {
      low: number;
      medium: number;
      high: number;
    };
  };
}

interface DatabaseOptions {
  sort?: Record<string, number>;
  limit?: number;
}

export function setupWebSocketHandlers(io: SocketIOServer): void {
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        return next(new Error('Authentication token required'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as JwtPayload;
      const user = await database.findOne('users', { id: decoded.userId }) as unknown as User | null;
      
      if (!user || !user.isActive) {
        return next(new Error('Invalid or expired token'));
      }

      socket.userId = user.id;
      socket.userRole = user.role || 'user';
      
      logger.info(`WebSocket authenticated: ${user.email} (${socket.id})`);
      next();

    } catch (error) {
      logger.error('WebSocket authentication failed:', error);
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    logger.info(`WebSocket connected: ${socket.userId} (${socket.id})`);

    if (socket.userId) {
      socket.join(`user:${socket.userId}`);
    }

    if (socket.userRole === 'admin') {
      socket.join('admin');
    }

    socket.on('subscribe_fraud_alerts', (data) => {
      const { severity, userId } = data;
      
      let room = 'fraud_alerts';
      if (severity) {
        room += `:${severity}`;
      }
      if (userId && socket.userRole === 'admin') {
        room += `:${userId}`;
      }
      
      socket.join(room);
      logger.info(`Socket ${socket.id} subscribed to ${room}`);
      
      socket.emit('subscription_confirmed', {
        type: 'fraud_alerts',
        room,
        timestamp: new Date()
      });
    });

    socket.on('subscribe_transactions', (data) => {
      const { userId, riskLevel } = data;
      
      let room = 'transactions';
      if (riskLevel) {
        room += `:${riskLevel}`;
      }
      if (userId) {
        room += `:${userId}`;
      }
      
      socket.join(room);
      logger.info(`Socket ${socket.id} subscribed to ${room}`);
      
      socket.emit('subscription_confirmed', {
        type: 'transactions',
        room,
        timestamp: new Date()
      });
    });

    socket.on('subscribe_dashboard', () => {
      socket.join('dashboard_metrics');
      logger.info(`Socket ${socket.id} subscribed to dashboard metrics`);
      
      socket.emit('subscription_confirmed', {
        type: 'dashboard_metrics',
        room: 'dashboard_metrics',
        timestamp: new Date()
      });

      sendDashboardMetrics(socket);
    });

    socket.on('join_investigation', (data) => {
      const { alertId } = data;
      
      if (socket.userRole === 'admin') {
        socket.join(`investigation:${alertId}`);
        logger.info(`Socket ${socket.id} joined investigation ${alertId}`);
        
        socket.emit('investigation_joined', {
          alertId,
          timestamp: new Date()
        });
      } else {
        socket.emit('error', {
          message: 'Insufficient permissions for investigation chat'
        });
      }
    });

    socket.on('investigation_message', async (data) => {
      const { alertId, message } = data;
      
      if (socket.userRole === 'admin') {
        const messageData = {
          id: `msg_${Date.now()}`,
          alertId,
          userId: socket.userId,
          message,
          timestamp: new Date()
        };

        io.to(`investigation:${alertId}`).emit('investigation_message', messageData);
        
        logger.info(`Investigation message: ${alertId} - ${message}`);
      }
    });

    socket.on('ping', () => {
      socket.emit('pong', { timestamp: new Date() });
    });

    socket.on('disconnect', (reason) => {
      logger.info(`WebSocket disconnected: ${socket.userId} (${socket.id}) - ${reason}`);
    });

    socket.on('error', (error) => {
      logger.error(`WebSocket error for ${socket.userId}:`, error);
    });

    socket.emit('connected', {
      message: 'Connected to AutheTrack AI real-time service',
      userId: socket.userId,
      timestamp: new Date()
    });
  });

  setInterval(() => {
    sendDashboardMetricsToAll(io);
  }, 30000);

  logger.info('WebSocket handlers initialized');
}

async function sendDashboardMetrics(socket: AuthenticatedSocket): Promise<void> {
  try {
    const metrics = await generateDashboardMetrics();
    socket.emit('dashboard_metrics', metrics);
  } catch (error) {
    logger.error('Failed to send dashboard metrics:', error);
  }
}

async function sendDashboardMetricsToAll(io: SocketIOServer): Promise<void> {
  try {
    const metrics = await generateDashboardMetrics();
    io.to('dashboard_metrics').emit('dashboard_metrics', metrics);
  } catch (error) {
    logger.error('Failed to broadcast dashboard metrics:', error);
  }
}

async function generateDashboardMetrics(): Promise<DashboardMetrics> {
  try {
    const recentTransactions = await database.find('transactions', {}, {
      sort: { timestamp: -1 },
      limit: 100
    } as DatabaseOptions) as Transaction[];

    const activeAlerts = await database.find('fraudAlerts', { status: 'open' }) as FraudAlert[];

    const totalTransactions = recentTransactions.length;
    const fraudTransactions = recentTransactions.filter((t) => t.fraudPrediction === 'fraud').length;
    const highRiskTransactions = recentTransactions.filter((t) => t.riskScore >= 0.7).length;
    const avgRiskScore = recentTransactions.reduce((sum, t) => sum + t.riskScore, 0) / totalTransactions || 0;

    const hourlyVolume = new Array(24).fill(0);
    const now = new Date();
    recentTransactions.forEach((t) => {
      const transactionTime = new Date(t.timestamp);
      const hoursDiff = Math.floor((now.getTime() - transactionTime.getTime()) / (1000 * 60 * 60));
      if (hoursDiff < 24) {
        hourlyVolume[23 - hoursDiff]++;
      }
    });

    return {
      timestamp: new Date(),
      metrics: {
        totalTransactions,
        fraudTransactions,
        highRiskTransactions,
        activeAlerts: activeAlerts.length,
        avgRiskScore: Math.round(avgRiskScore * 100) / 100,
        detectionAccuracy: 94.8,
        avgResponseTime: 23
      },
      charts: {
        hourlyVolume,
        riskDistribution: {
          low: recentTransactions.filter((t) => t.riskScore < 0.4).length,
          medium: recentTransactions.filter((t) => t.riskScore >= 0.4 && t.riskScore < 0.7).length,
          high: recentTransactions.filter((t) => t.riskScore >= 0.7).length
        }
      }
    };
  } catch (error) {
    logger.error('Failed to generate dashboard metrics:', error);
    return {
      timestamp: new Date(),
      metrics: {
        totalTransactions: 0,
        fraudTransactions: 0,
        highRiskTransactions: 0,
        activeAlerts: 0,
        avgRiskScore: 0,
        detectionAccuracy: 0,
        avgResponseTime: 0
      },
      charts: {
        hourlyVolume: new Array(24).fill(0),
        riskDistribution: {
          low: 0,
          medium: 0,
          high: 0
        }
      }
    };
  }
}

export function broadcastFraudAlert(io: SocketIOServer, alert: FraudAlert): void {
  io.to('fraud_alerts').emit('fraud_alert', {
    type: 'new_alert',
    alert,
    timestamp: new Date()
  });

  io.to(`fraud_alerts:${alert.severity}`).emit('fraud_alert', {
    type: 'new_alert',
    alert,
    timestamp: new Date()
  });

  logger.info(`Fraud alert broadcasted: ${alert.id}`);
}

export function broadcastTransactionUpdate(io: SocketIOServer, transaction: Transaction): void {
  io.to('transactions').emit('transaction_update', {
    type: 'transaction_updated',
    transaction,
    timestamp: new Date()
  });

  const riskLevel = transaction.riskScore >= 0.7 ? 'high' : 
                   transaction.riskScore >= 0.4 ? 'medium' : 'low';
  
  io.to(`transactions:${riskLevel}`).emit('transaction_update', {
    type: 'transaction_updated',
    transaction,
    timestamp: new Date()
  });

  logger.info(`Transaction update broadcasted: ${transaction.id}`);
}