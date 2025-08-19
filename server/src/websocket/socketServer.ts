// ### server/src/websocket/socketServer.ts

import { Server as SocketIOServer } from 'socket.io';
import { logger } from '../utils/logger';

interface SocketData {
  userId?: string;
  sessionId?: string;
}

function initializeSocketServer(io: SocketIOServer): void {
  io.on('connection', (socket) => {
    logger.info(`Client connected: ${socket.id}`);

    // Handle user authentication
    socket.on('authenticate', (data: { userId: string; token: string }) => {
      // Add authentication logic here
      const socketData: SocketData = socket.data;
      socketData.userId = data.userId;
      
      socket.join(`user_${data.userId}`);
      logger.info(`User ${data.userId} authenticated and joined room`);
      
      socket.emit('authenticated', { success: true });
    });

    // Handle real-time alerts
    socket.on('subscribe_alerts', (userId: string) => {
      socket.join(`alerts_${userId}`);
      logger.info(`User ${userId} subscribed to alerts`);
    });

    // Handle transaction updates
    socket.on('subscribe_transactions', (userId: string) => {
      socket.join(`transactions_${userId}`);
      logger.info(`User ${userId} subscribed to transaction updates`);
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      logger.info(`Client disconnected: ${socket.id}, reason: ${reason}`);
    });

    // Handle errors
    socket.on('error', (error) => {
      logger.error(`Socket error for ${socket.id}:`, error);
    });
  });

  // Utility functions for emitting events
  const emitAlert = (userId: string, alert: any) => {
    io.to(`alerts_${userId}`).emit('new_alert', alert);
  };

  const emitTransactionUpdate = (userId: string, transaction: any) => {
    io.to(`transactions_${userId}`).emit('transaction_update', transaction);
  };

  const emitRiskUpdate = (userId: string, riskData: any) => {
    io.to(`user_${userId}`).emit('risk_update', riskData);
  };

  // Attach utility functions to io instance for use in other parts of the application
  (io as any).emitAlert = emitAlert;
  (io as any).emitTransactionUpdate = emitTransactionUpdate;
  (io as any).emitRiskUpdate = emitRiskUpdate;

  logger.info('Socket server initialized successfully');
}

export { initializeSocketServer };