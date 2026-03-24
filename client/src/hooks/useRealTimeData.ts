import { useState, useEffect } from 'react';
import { useWebSocket } from './useWebSocket';  
export interface RealTimeAlert {
  id: string;
  type: 'fraud' | 'suspicious' | 'system' | 'account_sharing';
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  timestamp: string;
  status: 'active' | 'acknowledged' | 'resolved' | 'dismissed';
  userId?: string;
  transactionId?: string;
  riskScore?: number;
  location?: string;
  actionTaken?: string;
  assignedTo?: string;
}

export interface RealTimeTransaction {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  location: string;
  device: string;
  timestamp: string;
  riskScore: number;
  status: 'approved' | 'declined' | 'pending';
  fraudPrediction: boolean;
  flags: string[];
}

export interface RealTimeStats {
  totalTransactions: number;
  fraudDetected: number;
  falsePositives: number;
  accuracyRate: number;
  totalUsers: number;
  suspiciousUsers: number;
  blockedAmount: number;
  systemUptime: number;
}

export interface RealTimeData {
  stats?: Partial<RealTimeStats>;
  alerts?: RealTimeAlert[];
  transactions?: RealTimeTransaction[];
  isConnected: boolean;
  lastUpdate: string | null;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  retryCount: number;
}

export function useRealTimeData(): RealTimeData {
  const [data, setData] = useState<RealTimeData>({
    isConnected: false,
    lastUpdate: null,
    connectionStatus: 'disconnected',
    retryCount: 0,
  });

  const {
    connected: wsConnected,
    connecting,
    error,
    subscribeFraudAlerts,
    subscribeTransactions,
    subscribeDashboard,
  } = useWebSocket();

  useEffect(() => {
    setData((prev) => ({
      ...prev,
      isConnected: wsConnected,
      connectionStatus: connecting
        ? 'connecting'
        : wsConnected
        ? 'connected'
        : error
        ? 'error'
        : 'disconnected',
      retryCount: 0,
    }));
  }, [wsConnected, connecting, error]);

  useEffect(() => {
    if (!wsConnected) return;

    const unsubAlerts = subscribeFraudAlerts((alert: unknown) => {
      const realAlert = alert as RealTimeAlert;
      setData((prev) => ({
        ...prev,
        alerts: [realAlert, ...(prev.alerts || [])].slice(0, 50),
        lastUpdate: new Date().toISOString(),
      }));
    });

    const unsubTransactions = subscribeTransactions((transaction: unknown) => {
      const realTxn = transaction as RealTimeTransaction;
      setData((prev) => ({
        ...prev,
        transactions: [realTxn, ...(prev.transactions || [])].slice(0, 50),
        lastUpdate: new Date().toISOString(),
      }));
    });

    const unsubDashboard = subscribeDashboard((metrics: unknown) => {
      const realMetrics = metrics as RealTimeStats;
      setData((prev) => ({
        ...prev,
        stats: realMetrics,
        lastUpdate: new Date().toISOString(),
      }));
    });

    return () => {
      unsubAlerts();
      unsubTransactions();
      unsubDashboard();
    };
  }, [wsConnected, subscribeFraudAlerts, subscribeTransactions, subscribeDashboard]);

  return data;
}