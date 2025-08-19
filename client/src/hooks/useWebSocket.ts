// import { useEffect, useRef, useState, useCallback } from 'react';
// import { io, Socket } from 'socket.io-client';

// interface WebSocketMessage {
//   type: string;
//   payload: any;
//   timestamp: Date;
//   userId?: string;
// }

// interface UseWebSocketOptions {
//   autoConnect?: boolean;
//   reconnectAttempts?: number;
//   reconnectDelay?: number;
// }

// interface WebSocketState {
//   connected: boolean;
//   connecting: boolean;
//   error: string | null;
//   lastMessage: WebSocketMessage | null;
// }

// export const useWebSocket = (options: UseWebSocketOptions = {}) => {
//   const {
//     autoConnect = true,
//     reconnectAttempts = 5,
//     reconnectDelay = 1000
//   } = options;

//   const socketRef = useRef<Socket | null>(null);
//   const reconnectCountRef = useRef(0);
//   const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

//   const [state, setState] = useState<WebSocketState>({
//     connected: false,
//     connecting: false,
//     error: null,
//     lastMessage: null
//   });

//   const [listeners, setListeners] = useState<Map<string, Set<(data: any) => void>>>(new Map());

//   const connect = useCallback(() => {
//     if (socketRef.current?.connected) {
//       return;
//     }

//     setState(prev => ({ ...prev, connecting: true, error: null }));

//     const token = localStorage.getItem('authToken');
//     if (!token) {
//       setState(prev => ({
//         ...prev,
//         connecting: false,
//         error: 'Authentication token not found'
//       }));
//       return;
//     }

//     const socket = io(import.meta.env.VITE_WS_URL || 'http://localhost:3001', {
//       auth: { token },
//       transports: ['websocket', 'polling'],
//       timeout: 10000,
//       forceNew: true
//     });

//     socket.on('connect', () => {
//       console.log('WebSocket connected:', socket.id);
//       reconnectCountRef.current = 0;
//       setState(prev => ({
//         ...prev,
//         connected: true,
//         connecting: false,
//         error: null
//       }));
//     });

//     socket.on('disconnect', (reason) => {
//       console.log('WebSocket disconnected:', reason);
//       setState(prev => ({
//         ...prev,
//         connected: false,
//         connecting: false
//       }));

//       // Auto-reconnect logic
//       if (reason === 'io server disconnect') {
//         // Server initiated disconnect, don't reconnect
//         return;
//       }

//       if (reconnectCountRef.current < reconnectAttempts) {
//         reconnectCountRef.current++;
//         const delay = reconnectDelay * Math.pow(2, reconnectCountRef.current - 1);
        
//         console.log(`Attempting to reconnect in ${delay}ms (attempt ${reconnectCountRef.current}/${reconnectAttempts})`);
        
//         reconnectTimeoutRef.current = setTimeout(() => {
//           if (!socketRef.current?.connected) {
//             socket.connect();
//           }
//         }, delay);
//       } else {
//         setState(prev => ({
//           ...prev,
//           error: 'Maximum reconnection attempts reached'
//         }));
//       }
//     });

//     socket.on('connect_error', (error) => {
//       console.error('WebSocket connection error:', error);
//       setState(prev => ({
//         ...prev,
//         connecting: false,
//         error: error.message || 'Connection failed'
//       }));
//     });

//     // Handle incoming messages
//     socket.onAny((eventName: string, data: any) => {
//       const message: WebSocketMessage = {
//         type: eventName,
//         payload: data,
//         timestamp: new Date(),
//         userId: data.userId
//       };

//       setState(prev => ({ ...prev, lastMessage: message }));

//       // Notify listeners
//       const eventListeners = listeners.get(eventName);
//       if (eventListeners) {
//         eventListeners.forEach(callback => callback(data));
//       }
//     });

//     socketRef.current = socket;
//   }, [reconnectAttempts, reconnectDelay, listeners]);

//   const disconnect = useCallback(() => {
//     if (reconnectTimeoutRef.current) {
//       clearTimeout(reconnectTimeoutRef.current);
//       reconnectTimeoutRef.current = null;
//     }

//     if (socketRef.current) {
//       socketRef.current.disconnect();
//       socketRef.current = null;
//     }

//     setState({
//       connected: false,
//       connecting: false,
//       error: null,
//       lastMessage: null
//     });
//   }, []);

//   const emit = useCallback((event: string, data?: any) => {
//     if (socketRef.current?.connected) {
//       socketRef.current.emit(event, data);
//       return true;
//     }
//     return false;
//   }, []);

//   const subscribe = useCallback((event: string, callback: (data: any) => void) => {
//     setListeners(prev => {
//       const newListeners = new Map(prev);
//       if (!newListeners.has(event)) {
//         newListeners.set(event, new Set());
//       }
//       newListeners.get(event)!.add(callback);
//       return newListeners;
//     });

//     // Return unsubscribe function
//     return () => {
//       setListeners(prev => {
//         const newListeners = new Map(prev);
//         const eventListeners = newListeners.get(event);
//         if (eventListeners) {
//           eventListeners.delete(callback);
//           if (eventListeners.size === 0) {
//             newListeners.delete(event);
//           }
//         }
//         return newListeners;
//       });
//     };
//   }, []);

//   // Specialized subscription methods
//   const subscribeFraudAlerts = useCallback((callback: (alert: any) => void, severity?: string) => {
//     const unsubscribe = subscribe('fraud_alert', callback);
    
//     if (socketRef.current?.connected) {
//       emit('subscribe_fraud_alerts', { severity });
//     }
    
//     return unsubscribe;
//   }, [subscribe, emit]);

//   const subscribeTransactions = useCallback((callback: (transaction: any) => void, options?: {
//     userId?: string;
//     riskLevel?: string;
//   }) => {
//     const unsubscribe = subscribe('transaction_update', callback);
    
//     if (socketRef.current?.connected) {
//       emit('subscribe_transactions', options);
//     }
    
//     return unsubscribe;
//   }, [subscribe, emit]);

//   const subscribeDashboard = useCallback((callback: (metrics: any) => void) => {
//     const unsubscribe = subscribe('dashboard_metrics', callback);
    
//     if (socketRef.current?.connected) {
//       emit('subscribe_dashboard');
//     }
    
//     return unsubscribe;
//   }, [subscribe, emit]);

//   const joinInvestigation = useCallback((alertId: string) => {
//     if (socketRef.current?.connected) {
//       emit('join_investigation', { alertId });
//     }
//   }, [emit]);

//   const sendInvestigationMessage = useCallback((alertId: string, message: string) => {
//     if (socketRef.current?.connected) {
//       emit('investigation_message', { alertId, message });
//     }
//   }, [emit]);

//   // Auto-connect on mount
//   useEffect(() => {
//     if (autoConnect) {
//       connect();
//     }

//     return () => {
//       disconnect();
//     };
//   }, [autoConnect, connect, disconnect]);

//   // Ping/pong for connection health
//   useEffect(() => {
//     if (!state.connected) return;

//     const pingInterval = setInterval(() => {
//       if (socketRef.current?.connected) {
//         emit('ping');
//       }
//     }, 30000); // Ping every 30 seconds

//     return () => clearInterval(pingInterval);
//   }, [state.connected, emit]);

//   return {
//     ...state,
//     connect,
//     disconnect,
//     emit,
//     subscribe,
//     subscribeFraudAlerts,
//     subscribeTransactions,
//     subscribeDashboard,
//     joinInvestigation,
//     sendInvestigationMessage
//   };
// };

// export default useWebSocket;


import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

interface UseWebSocketReturn {
  socket: Socket | null;
  connected: boolean;
  connecting: boolean;
  error: string | null;
  subscribeFraudAlerts: (callback: (alert: any) => void, severity?: string) => () => void;
  subscribeTransactions: (callback: (transaction: any) => void, filters?: any) => () => void;
  subscribeDashboard: (callback: (metrics: any) => void) => () => void;
  connect: () => void;
  disconnect: () => void;
  emit: (event: string, data?: any) => boolean;
  reconnect: () => void;
}

export const useWebSocket = (): UseWebSocketReturn => {
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const listenersRef = useRef<Map<string, Set<(data: any) => void>>>(new Map());
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);

  const WS_URL = 'http://localhost:3001';
  const MAX_RECONNECT_ATTEMPTS = 5;
  const RECONNECT_DELAY = 2000;

  const connect = useCallback(() => {
    if (socketRef.current?.connected) return;

    setConnecting(true);
    setError(null);

    try {
      const socket = io(WS_URL, {
        transports: ['websocket', 'polling'],
        timeout: 10000,
        forceNew: true,
        reconnection: true,
        reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
        reconnectionDelay: RECONNECT_DELAY,
      });

      socket.on('connect', () => {
        console.log('WebSocket connected:', socket.id);
        setConnected(true);
        setConnecting(false);
        setError(null);
        reconnectAttemptsRef.current = 0;

        // Clear any pending reconnection timeout
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
      });

      socket.on('disconnect', (reason) => {
        console.log('WebSocket disconnected:', reason);
        setConnected(false);
        setConnecting(false);
        
        if (reason === 'io server disconnect') {
          // Server disconnected, need manual reconnection
          setError('Server disconnected');
        } else {
          // Client disconnected or network issue
          setError('Connection lost');
          scheduleReconnection();
        }
      });

      socket.on('connect_error', (err) => {
        console.error('WebSocket connection error:', err);
        setConnected(false);
        setConnecting(false);
        setError('Failed to connect to server');
        scheduleReconnection();
      });

      // Handle all socket events for subscribers
      socket.onAny((event, payload) => {
        const handlers = listenersRef.current.get(event);
        if (handlers) {
          handlers.forEach((callback) => {
            try {
              callback(payload);
            } catch (error) {
              console.error('Error in socket event handler:', error);
            }
          });
        }
      });

      socketRef.current = socket;
    } catch (error) {
      console.error('Failed to create socket connection:', error);
      setConnecting(false);
      setError('Failed to initialize connection');
      scheduleReconnection();
    }
  }, []);

  const scheduleReconnection = useCallback(() => {
    if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
      setError('Max reconnection attempts reached');
      return;
    }

    reconnectAttemptsRef.current += 1;
    const delay = RECONNECT_DELAY * reconnectAttemptsRef.current;

    console.log(`Scheduling reconnection attempt ${reconnectAttemptsRef.current} in ${delay}ms`);

    reconnectTimeoutRef.current = setTimeout(() => {
      if (!socketRef.current?.connected) {
        console.log('Attempting to reconnect...');
        connect();
      }
    }, delay);
  }, [connect]);

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

  const emit = useCallback((event: string, data?: any) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
      return true;
    }
    console.warn('Cannot emit event - socket not connected:', event);
    return false;
  }, []);

  const subscribe = useCallback((event: string, callback: (data: any) => void) => {
    if (!listenersRef.current.has(event)) {
      listenersRef.current.set(event, new Set());
    }
    listenersRef.current.get(event)!.add(callback);

    // Return unsubscribe function
    return () => {
      const set = listenersRef.current.get(event);
      if (set) {
        set.delete(callback);
        if (set.size === 0) {
          listenersRef.current.delete(event);
        }
      }
    };
  }, []);

  const subscribeFraudAlerts = useCallback(
    (callback: (alert: any) => void, severity?: string) => {
      const unsubscribe = subscribe('fraud_alert', callback);
      
      // Request subscription from server if connected
      if (socketRef.current?.connected) {
        emit('subscribe_fraud_alerts', { severity });
      }
      
      return unsubscribe;
    },
    [subscribe, emit]
  );

  const subscribeTransactions = useCallback(
    (callback: (transaction: any) => void, filters?: any) => {
      const unsubscribe = subscribe('transaction_update', callback);
      
      // Request subscription from server if connected
      if (socketRef.current?.connected) {
        emit('subscribe_transactions', filters);
      }
      
      return unsubscribe;
    },
    [subscribe, emit]
  );

  const subscribeDashboard = useCallback(
    (callback: (metrics: any) => void) => {
      const unsubscribe = subscribe('dashboard_metrics', callback);
      
      // Request subscription from server if connected
      if (socketRef.current?.connected) {
        emit('subscribe_dashboard');
      }
      
      return unsubscribe;
    },
    [subscribe, emit]
  );

  const reconnect = useCallback(() => {
    console.log('Manual reconnection requested');
    disconnect();
    reconnectAttemptsRef.current = 0;
    setTimeout(connect, 1000);
  }, [disconnect, connect]);

  // Initialize connection on mount
  useEffect(() => {
    connect();

    // Cleanup on unmount
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      disconnect();
    };
  }, []);

  // Handle window focus to reconnect if needed
  useEffect(() => {
    const handleFocus = () => {
      if (!socketRef.current?.connected && !connecting) {
        console.log('Window focused - checking connection');
        connect();
      }
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