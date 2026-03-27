import React, { useState, useEffect } from 'react';
import { TrendingUp, AlertTriangle, Activity, DollarSign } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell
} from 'recharts';
import { useRealTimeData } from '../hooks/useRealTimeData';

interface DashboardStats {
  totalTransactions: number;
  fraudDetected: number;
  falsePositives: number;
  accuracyRate: number;
  totalUsers: number;
  suspiciousUsers: number;
  blockedAmount: number;
  systemUptime: number;
}

type AlertItem = {
  id: string;
  type: 'fraud' | 'suspicious' | 'system' | 'account_sharing';
  message: string;
  timestamp: string;
  severity: 'high' | 'medium' | 'low';
};

type IncomingAlert = {
  id: string;
  type: 'fraud' | 'suspicious' | 'system' | 'account_sharing';
  title?: string;
  description?: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
};

interface Transaction {
  fraudPrediction: boolean;
  riskScore: number;
}

interface RealTimeData {
  stats?: Partial<DashboardStats>;
  alerts?: IncomingAlert[];
  transactions?: Transaction[];
  isConnected?: boolean;
}

interface ChartData {
  time: string;
  transactions: number;
  fraudDetected: number;
  riskScore: number;
}

interface RiskDistributionData {
  name: string;
  value: number;
  color: string;
}

type StatCardProps = {
  title: string;
  value: number | string;
  change: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: 'up' | 'down';
  suffix?: string;
};

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalTransactions: 45284,
    fraudDetected: 1247,
    falsePositives: 89,
    accuracyRate: 97.8,
    totalUsers: 12456,
    suspiciousUsers: 34,
    blockedAmount: 284750,
    systemUptime: 99.94
  });

  const [recentAlerts, setRecentAlerts] = useState<AlertItem[]>([
    {
      id: '1',
      type: 'fraud',
      message: 'High-risk transaction detected',
      timestamp: new Date().toISOString(),
      severity: 'high'
    }
  ]);

  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [riskDistribution, setRiskDistribution] = useState<RiskDistributionData[]>([
    { name: 'Low Risk', value: 75, color: '#10B981' },
    { name: 'Medium Risk', value: 20, color: '#F59E0B' },
    { name: 'High Risk', value: 5, color: '#EF4444' }
  ]);

  const realTimeData = useRealTimeData() as RealTimeData;

  useEffect(() => {
    const now = new Date();
    const data: ChartData[] = [];

    for (let i = 23; i >= 0; i--) {
      const t = new Date(now.getTime() - i * 3600000);
      data.push({
        time: t.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        transactions: Math.floor(Math.random() * 500),
        fraudDetected: Math.floor(Math.random() * 20),
        riskScore: Math.random()
      });
    }

    setChartData(data);
  }, []);

  useEffect(() => {
    if (realTimeData.stats) {
      setStats(prev => ({ ...prev, ...realTimeData.stats }));
    }

    if (realTimeData.alerts?.length) {
      setRecentAlerts(prev => {
        const mapped = realTimeData.alerts!.map((a: IncomingAlert) => ({
          id: a.id,
          type: a.type,
          message: a.title || a.description || '',
          timestamp: a.timestamp,
          severity: a.severity === 'critical' ? 'high' : a.severity
        }));

        const existing = new Set(prev.map(p => p.id));
        const unique = mapped.filter(m => !existing.has(m.id));
        return [...unique, ...prev].slice(0, 10);
      });
    }

    const tx = realTimeData.transactions?.[0];
    if (!tx) return;

    const now = new Date();

    setChartData(prev => {
      const last = prev[prev.length - 1];
      const newPoint: ChartData = {
        time: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        transactions: (last?.transactions || 0) + 1,
        fraudDetected: tx.fraudPrediction
          ? (last?.fraudDetected || 0) + 1
          : (last?.fraudDetected || 0),
        riskScore: tx.riskScore
      };
      return [...prev.slice(1), newPoint];
    });

    const level =
      tx.riskScore > 0.7 ? 'High Risk' :
      tx.riskScore > 0.3 ? 'Medium Risk' : 'Low Risk';

    setRiskDistribution(prev => {
      const updated = prev.map(r =>
        r.name === level ? { ...r, value: r.value + 1 } : r
      );
      const total = updated.reduce((s, i) => s + i.value, 0);
      return updated.map(i => ({
        ...i,
        value: Math.round((i.value / total) * 100)
      }));
    });
  }, [realTimeData]);

  const StatCard = ({
    title,
    value,
    change,
    icon: Icon,
    trend = 'up',
    suffix = ''
  }: StatCardProps) => (
    <div className="bg-white p-6 rounded-lg shadow border">
      <div className="flex justify-between">
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-xl font-semibold">
            {typeof value === 'number' ? value.toLocaleString() : value}{suffix}
          </p>
        </div>
        <Icon className="h-6 w-6" />
      </div>
      <p className={trend === 'up' ? 'text-green-600' : 'text-red-600'}>
        {change}
      </p>
    </div>
  );

  const getColor = (s: string) =>
    s === 'high'
      ? 'bg-red-50 border-red-200'
      : s === 'medium'
      ? 'bg-yellow-50 border-yellow-200'
      : 'bg-green-50 border-green-200';

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Fraud Detection Dashboard</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Transactions" value={stats.totalTransactions} change="+12%" icon={Activity} />
        <StatCard title="Fraud" value={stats.fraudDetected} change="+8%" icon={AlertTriangle} />
        <StatCard title="Accuracy" value={stats.accuracyRate} change="+0.2%" icon={TrendingUp} suffix="%" />
        <StatCard title="Blocked" value={`$${(stats.blockedAmount / 1000).toFixed(0)}K`} change="+15%" icon={DollarSign} />
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={chartData}>
          <XAxis dataKey="time" />
          <YAxis />
          <Tooltip />
          <Area dataKey="transactions" stroke="#3B82F6" fill="#3B82F6" />
          <Area dataKey="fraudDetected" stroke="#EF4444" fill="#EF4444" />
        </AreaChart>
      </ResponsiveContainer>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <XAxis dataKey="time" />
          <YAxis domain={[0, 1]} />
          <Tooltip />
          <Line dataKey="riskScore" stroke="#F59E0B" />
        </LineChart>
      </ResponsiveContainer>

      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie data={riskDistribution} dataKey="value">
            {riskDistribution.map((e, i) => (
              <Cell key={i} fill={e.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>

      <div className="space-y-2">
        {recentAlerts.map(a => (
          <div key={a.id} className={`p-3 border rounded ${getColor(a.severity)}`}>
            <p>{a.message}</p>
            <small>{new Date(a.timestamp).toLocaleString()}</small>
          </div>
        ))}
      </div>
    </div>
  );
}