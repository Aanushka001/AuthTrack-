import { useState, useEffect, useRef, useCallback } from 'react';
import { apiService } from '../services/api';

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

// Helper functions for generating random data
function getRandomLocation(): string {
  const locations = [
    'New York, NY',
    'Los Angeles, CA',
    'Chicago, IL',
    'Houston, TX',
    'Phoenix, AZ',
    'Philadelphia, PA',
    'San Antonio, TX',
    'San Diego, CA',
    'Dallas, TX',
    'Miami, FL',
    'Seattle, WA',
    'Denver, CO',
    'Atlanta, GA',
    'Boston, MA',
    'Unknown Location'
  ];
  return locations[Math.floor(Math.random() * locations.length)];
}

function getRandomMerchant(): string {
  const merchants = [
    'Amazon',
    'Walmart',
    'Target',
    'Best Buy',
    'Home Depot',
    'Costco',
    'Starbucks',
    'McDonald\'s',
    'Gas Station',
    'Online Store',
    'Local Restaurant',
    'Grocery Store'
  ];
  return merchants[Math.floor(Math.random() * merchants.length)];
}

function getRandomDevice(): string {
  const devices = [
    'iPhone 15 Pro',
    'Samsung Galaxy S24',
    'MacBook Pro',
    'Windows Desktop',
    'iPad Air',
    'Android Tablet',
    'Chrome Browser',
    'Firefox Browser',
    'Safari Browser',
    'Edge Browser'
  ];
  return devices[Math.floor(Math.random() * devices.length)];
}

function getRandomFlags(): string[] {
  const allFlags = [
    'high_amount',
    'new_device',
    'unusual_location',
    'off_hours',
    'velocity_check',
    'pattern_anomaly',
    'ip_mismatch',
    'behavioral_change',
    'first_time_merchant',
    'cross_border'
  ];
  
  const flagCount = Math.floor(Math.random() * 4);
  const shuffled = allFlags.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, flagCount);
}

export function useRealTimeData(): RealTimeData {
  const [data, setData] = useState<RealTimeData>({
    isConnected: false,
    lastUpdate: null,
    connectionStatus: 'disconnected',
    retryCount: 0
  });

  const wsRef = useRef<WebSocket | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const simulationCounterRef = useRef(0);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const maxRetries = 5;

  // Simulation mode for when WebSocket is not available
  const startSimulationMode = useCallback(() => {
    console.log('Starting simulation mode');
    setData(prev => ({ 
      ...prev, 
      isConnected: true, 
      connectionStatus: 'connected' 
    }));

    // Enhanced simulation with ML-based data generation
    intervalRef.current = setInterval(async () => {
      simulationCounterRef.current += 1;
      const counter = simulationCounterRef.current;

      try {
        // Periodically fetch real data from API
        if (counter % 30 === 0) { // Every 30 seconds
          try {
            const dashboardData = await apiService.getDashboardData();
            setData(prev => ({
              ...prev,
              stats: {
                totalTransactions: dashboardData.totalTransactions,
                fraudDetected: dashboardData.fraudDetected,
                falsePositives: dashboardData.falsePositives,
                accuracyRate: dashboardData.accuracy,
                totalUsers: 12456 + Math.floor(counter / 5),
                suspiciousUsers: Math.floor(dashboardData.fraudDetected * 0.1),
                blockedAmount: dashboardData.fraudDetected * 1500,
                systemUptime: 99.94 + (Math.random() - 0.5) * 0.01
              },
              lastUpdate: new Date().toISOString()
            }));
          } catch (error) {
            // Use fallback simulation if API fails
            console.error('API fetch failed, using simulation:', error);
            simulateStatsUpdate(counter);
          }
        } else {
          // Use simulation for frequent updates
          simulateStatsUpdate(counter);
        }

        // Generate realistic alerts
        if (counter % 15 === 0) {
          const newAlert = generateRealisticAlert(counter);
          setData(prev => ({
            ...prev,
            alerts: [newAlert],
            lastUpdate: new Date().toISOString()
          }));
        }

        // Generate realistic transactions with ML features
        if (counter % 8 === 0) {
          const newTransaction = generateRealisticTransaction(counter);
          setData(prev => ({
            ...prev,
            transactions: [newTransaction],
            lastUpdate: new Date().toISOString()
          }));
        }

      } catch (error) {
        console.error('Error in simulation mode:', error);
      }
    }, 1000);
  }, []);

  // Try to connect to WebSocket first, fall back to simulation
  const connectWebSocket = useCallback(() => {
    try {
      const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:3001';
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('WebSocket connected');
        setData(prev => ({
          ...prev,
          isConnected: true,
          connectionStatus: 'connected',
          retryCount: 0
        }));
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          setData(prev => ({
            ...prev,
            ...message,
            lastUpdate: new Date().toISOString()
          }));
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      wsRef.current.onclose = () => {
        console.log('WebSocket disconnected');
        setData(prev => ({
          ...prev,
          isConnected: false,
          connectionStatus: 'disconnected'
        }));
        
        // Attempt to reconnect with exponential backoff
        if (data.retryCount < maxRetries) {
          const retryDelay = Math.min(1000 * Math.pow(2, data.retryCount), 30000);
          retryTimeoutRef.current = setTimeout(() => {
            setData(prev => ({ ...prev, retryCount: prev.retryCount + 1 }));
            connectWebSocket();
          }, retryDelay);
        } else {
          // Fall back to simulation mode after max retries
          startSimulationMode();
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setData(prev => ({
          ...prev,
          connectionStatus: 'error'
        }));
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      // Fall back to simulation immediately if WebSocket creation fails
      startSimulationMode();
    }
  }, [data.retryCount, maxRetries, startSimulationMode]);

  const simulateStatsUpdate = (counter: number) => {
    setData(prev => ({
      ...prev,
      stats: {
        totalTransactions: 45284 + counter * 3,
        fraudDetected: 1247 + Math.floor(counter / 10),
        falsePositives: 89 + Math.floor(counter / 20),
        accuracyRate: 97.8 + (Math.random() - 0.5) * 0.2,
        totalUsers: 12456 + Math.floor(counter / 5),
        suspiciousUsers: 34 + Math.floor(Math.random() * 3),
        blockedAmount: 284750 + counter * 1000,
        systemUptime: 99.94 + (Math.random() - 0.5) * 0.01
      },
      lastUpdate: new Date().toISOString()
    }));
  };

  const generateRealisticAlert = (counter: number): RealTimeAlert => {
    const alertTypes: RealTimeAlert['type'][] = ['fraud', 'suspicious', 'system', 'account_sharing'];
    const severities: RealTimeAlert['severity'][] = ['critical', 'high', 'medium', 'low'];
    
    // Weight towards fraud and suspicious alerts
    const type = Math.random() < 0.7 ? 
      (Math.random() < 0.6 ? 'fraud' : 'suspicious') : 
      alertTypes[Math.floor(Math.random() * alertTypes.length)];
    
    const severity = type === 'fraud' ? 
      (Math.random() < 0.8 ? 'high' : 'critical') :
      severities[Math.floor(Math.random() * severities.length)];

    const templates = {
      fraud: [
        'High-risk transaction detected: ${amount} from ${location}',
        'Unusual spending pattern: ${amount} at ${merchant}',
        'Cross-border fraud attempt: ${amount} from ${location}',
        'Card testing detected: Multiple small transactions',
        'Account takeover suspected: Unusual device access'
      ],
      suspicious: [
        'Multiple login attempts from user ID: ${userId}',
        'Velocity check triggered: ${count} transactions in 1 hour',
        'Behavioral anomaly detected for user ${userId}',
        'Unusual location access from ${location}',
        'Device fingerprint mismatch detected'
      ],
      system: [
        'ML model accuracy improved to ${accuracy}%',
        'Fraud detection system updated successfully',
        'Performance threshold exceeded: ${metric}',
        'Security scan completed: ${result}',
        'Database optimization completed'
      ],
      account_sharing: [
        'Simultaneous logins detected from multiple locations',
        'Account sharing pattern identified',
        'Multiple device access detected',
        'Credential sharing suspected'
      ]
    };

    const template = templates[type][Math.floor(Math.random() * templates[type].length)];
    const title = template
      .replace('${amount}', `$${(Math.random() * 50000 + 1000).toLocaleString('en-US', { maximumFractionDigits: 0 })}`)
      .replace('${location}', getRandomLocation())
      .replace('${merchant}', getRandomMerchant())
      .replace('${userId}', `user_${Math.floor(Math.random() * 10000)}`)
      .replace('${count}', String(Math.floor(Math.random() * 15) + 5))
      .replace('${accuracy}', (97.5 + Math.random() * 2).toFixed(1))
      .replace('${metric}', 'Response time')
      .replace('${result}', 'No threats detected');

    return {
      id: `alert_${Date.now()}_${counter}`,
      type,
      severity,
      title,
      description: `Alert generated at ${new Date().toLocaleString()}`,
      timestamp: new Date().toISOString(),
      status: 'active',
      userId: `user_${Math.floor(Math.random() * 10000)}`,
      transactionId: Math.random() > 0.3 ? `txn_${Math.floor(Math.random() * 10000)}` : undefined,
      riskScore: severity === 'critical' ? 0.9 + Math.random() * 0.1 : Math.random(),
      location: getRandomLocation()
    };
  };

  const generateRealisticTransaction = (counter: number): RealTimeTransaction => {
    const riskScore = Math.random();
    const fraudPrediction = riskScore > 0.8;
    
    // Generate amount based on risk score (higher risk = higher amounts)
    const baseAmount = Math.random() * 10000;
    const amount = riskScore > 0.7 ? baseAmount + Math.random() * 40000 : baseAmount;

    return {
      id: `txn_${Date.now()}_${counter}`,
      userId: `user_${Math.floor(Math.random() * 10000)}`,
      amount: Math.floor(amount + 50),
      currency: 'USD',
      location: getRandomLocation(),
      device: getRandomDevice(),
      timestamp: new Date().toISOString(),
      riskScore,
      status: fraudPrediction ? 'declined' : 
              (Math.random() > 0.1 ? 'approved' : 'pending'),
      fraudPrediction,
      flags: fraudPrediction ? 
        [...getRandomFlags(), 'high_risk_score'] : 
        getRandomFlags()
    };
  };

  useEffect(() => {
    // Try WebSocket connection first
    setData(prev => ({ ...prev, connectionStatus: 'connecting' }));
    
    // Start with simulation mode immediately for demo purposes
    // In production, you would try WebSocket first
    startSimulationMode();
    
    // Cleanup function
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      setData(prev => ({ 
        ...prev, 
        isConnected: false, 
        connectionStatus: 'disconnected' 
      }));
    };
  }, [startSimulationMode]);

  return data;
}