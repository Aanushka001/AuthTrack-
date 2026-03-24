import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3001';
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 2000;

interface UseWebSocketReturn {
  socket: Socket | null;
  connected: boolean;
  connecting: boolean;
  error: string | null;
  subscribeFraudAlerts: (callback: (alert: unknown) => void, severity?: string) => () => void;
  subscribeTransactions: (callback: (transaction: unknown) => void, filters?: object) => () => void;
  subscribeDashboard: (callback: (metrics: unknown) => void) => () => void;
  connect: () => void;
  disconnect: () => void;
  emit: (event: string, data?: unknown) => boolean;
  reconnect: () => void;
}

export const useWebSocket = (): UseWebSocketReturn => {
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const listenersRef = useRef<Map<string, Set<(data: unknown) => void>>>(new Map());
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttemptsRef = useRef(0);

  const emit = useCallback((event: string, data?: unknown): boolean => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
      return true;
    }
    return false;
  }, []);

  const subscribe = useCallback((event: string, callback: (data: unknown) => void) => {
    if (!listenersRef.current.has(event)) {
      listenersRef.current.set(event, new Set());
    }
    listenersRef.current.get(event)!.add(callback);

    return () => {
      const set = listenersRef.current.get(event);
      if (set) {
        set.delete(callback);
        if (set.size === 0) listenersRef.current.delete(event);
      }
    };
  }, []);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setConnected(false);
    setConnecting(false);
    setError(null);
    reconnectAttemptsRef.current = 0;
  }, []);

  const connect = useCallback(() => {
    if (socketRef.current?.connected) return;

    setConnecting(true);
    setError(null);

    const token = localStorage.getItem('authToken');

    const socket = io(WS_URL, {
      auth: token ? { token } : undefined,
      transports: ['websocket', 'polling'],
      timeout: 10000,
      forceNew: true,
      reconnection: false, // manual reconnection below
    });

    socket.on('connect', () => {
      setConnected(true);
      setConnecting(false);
      setError(null);
      reconnectAttemptsRef.current = 0;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    });

    socket.on('disconnect', (reason) => {
      setConnected(false);
      setConnecting(false);
      if (reason === 'io server disconnect') {
        setError('Server disconnected');
        return;
      }
      setError('Connection lost');
      if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttemptsRef.current += 1;
        const delay = RECONNECT_DELAY * reconnectAttemptsRef.current;
        reconnectTimeoutRef.current = setTimeout(() => {
          if (!socketRef.current?.connected) connect();
        }, delay);
      } else {
        setError('Max reconnection attempts reached');
      }
    });

    socket.on('connect_error', () => {
      setConnecting(false);
      setError('Failed to connect to server');
    });

    socket.onAny((event: string, payload: unknown) => {
      const handlers = listenersRef.current.get(event);
      if (handlers) {
        handlers.forEach((cb) => cb(payload));
      }
    });

    socketRef.current = socket;
  }, []);

  const subscribeFraudAlerts = useCallback(
    (callback: (alert: unknown) => void, severity?: string) => {
      const unsubscribe = subscribe('fraud_alert', callback);
      emit('subscribe_fraud_alerts', { severity });
      return unsubscribe;
    },
    [subscribe, emit]
  );

  const subscribeTransactions = useCallback(
    (callback: (transaction: unknown) => void, filters?: object) => {
      const unsubscribe = subscribe('transaction_update', callback);
      emit('subscribe_transactions', filters);
      return unsubscribe;
    },
    [subscribe, emit]
  );

  const subscribeDashboard = useCallback(
    (callback: (metrics: unknown) => void) => {
      const unsubscribe = subscribe('dashboard_metrics', callback);
      emit('subscribe_dashboard');
      return unsubscribe;
    },
    [subscribe, emit]
  );

  const reconnect = useCallback(() => {
    disconnect();
    reconnectAttemptsRef.current = 0;
    setTimeout(connect, 500);
  }, [disconnect, connect]);

  useEffect(() => {
    connect();
    return () => disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handleFocus = () => {
      if (!socketRef.current?.connected && !connecting) connect();
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [connect, connecting]);

  return {
    socket: socketRef.current,
    connected,
    connecting,
    error,
    subscribeFraudAlerts,
    subscribeTransactions,
    subscribeDashboard,
    connect,
    disconnect,
    emit,
    reconnect,
  };
};

export default useWebSocket;