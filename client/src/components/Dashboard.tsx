// import React, { useState, useEffect } from 'react';
// import { Shield, TrendingUp, AlertTriangle, Users, Activity, DollarSign } from 'lucide-react';
// import { useRealTimeData } from '../hooks/useRealTimeData';

// interface DashboardStats {
//   totalTransactions: number;
//   fraudDetected: number;
//   falsePositives: number;
//   accuracyRate: number;
//   totalUsers: number;
//   suspiciousUsers: number;
//   blockedAmount: number;
//   systemUptime: number;
// }

// interface AlertItem {
//   id: string;
//   type: 'fraud' | 'suspicious' | 'system';
//   message: string;
//   timestamp: string;
//   severity: 'high' | 'medium' | 'low';
// }

// interface RealTimeData {
//   stats?: Partial<DashboardStats>;
//   alerts?: AlertItem[];
// }

// export default function Dashboard() {
//   const [stats, setStats] = useState<DashboardStats>({
//     totalTransactions: 45284,
//     fraudDetected: 1247,
//     falsePositives: 89,
//     accuracyRate: 97.8,
//     totalUsers: 12456,
//     suspiciousUsers: 34,
//     blockedAmount: 284750,
//     systemUptime: 99.94
//   });

//   const [recentAlerts, setRecentAlerts] = useState<AlertItem[]>([
//     {
//       id: '1',
//       type: 'fraud',
//       message: 'High-risk transaction detected: $15,000 from anomalous location',
//       timestamp: new Date().toISOString(),
//       severity: 'high'
//     },
//     {
//       id: '2',
//       type: 'suspicious',
//       message: 'Multiple login attempts from user ID: 7892',
//       timestamp: new Date(Date.now() - 300000).toISOString(),
//       severity: 'medium'
//     },
//     {
//       id: '3',
//       type: 'system',
//       message: 'ML model accuracy improved to 97.8%',
//       timestamp: new Date(Date.now() - 600000).toISOString(),
//       severity: 'low'
//     }
//   ]);

// const realTimeData = useRealTimeData() as unknown as RealTimeData;

//   useEffect(() => {
//     if (realTimeData?.stats) {
//       setStats(prev => ({ ...prev, ...realTimeData.stats }));
//     }
//     if (realTimeData?.alerts && realTimeData.alerts.length > 0) {
//       setRecentAlerts(prev => [...realTimeData.alerts!, ...prev].slice(0, 10));
//     }
//   }, [realTimeData]);

//   const StatCard = ({
//     title,
//     value,
//     change,
//     icon: Icon,
//     trend = 'up',
//     suffix = ''
//   }: {
//     title: string;
//     value: number | string;
//     change: string;
//     icon: React.ComponentType<{ className?: string }>;
//     trend?: 'up' | 'down';
//     suffix?: string;
//   }) => (
//     <div className="bg-white p-6 rounded-lg shadow-sm border">
//       <div className="flex items-center justify-between">
//         <div>
//           <p className="text-sm font-medium text-gray-600">{title}</p>
//           <p className="text-2xl font-semibold text-gray-900">
//             {typeof value === 'number' ? value.toLocaleString() : value}
//             {suffix}
//           </p>
//         </div>
//         <div
//           className={`p-3 rounded-full ${
//             Icon === Shield
//               ? 'bg-blue-100'
//               : Icon === TrendingUp
//               ? 'bg-green-100'
//               : Icon === AlertTriangle
//               ? 'bg-red-100'
//               : Icon === Users
//               ? 'bg-purple-100'
//               : 'bg-gray-100'
//           }`}
//         >
//           <Icon
//             className={`h-6 w-6 ${
//               Icon === Shield
//                 ? 'text-blue-600'
//                 : Icon === TrendingUp
//                 ? 'text-green-600'
//                 : Icon === AlertTriangle
//                 ? 'text-red-600'
//                 : Icon === Users
//                 ? 'text-purple-600'
//                 : 'text-gray-600'
//             }`}
//           />
//         </div>
//       </div>
//       <div className="mt-4 flex items-center">
//         <span
//           className={`text-sm font-medium ${
//             trend === 'up' ? 'text-green-600' : 'text-red-600'
//           }`}
//         >
//           {change}
//         </span>
//         <span className="text-sm text-gray-500 ml-2">from last hour</span>
//       </div>
//     </div>
//   );

//   const getAlertColor = (severity: string) => {
//     switch (severity) {
//       case 'high':
//         return 'bg-red-50 border-red-200 text-red-800';
//       case 'medium':
//         return 'bg-yellow-50 border-yellow-200 text-yellow-800';
//       case 'low':
//         return 'bg-green-50 border-green-200 text-green-800';
//       default:
//         return 'bg-gray-50 border-gray-200 text-gray-800';
//     }
//   };

//   return (
//     <div className="space-y-6">
//       <div>
//         <h1 className="text-2xl font-bold text-gray-900">
//           Fraud Detection Dashboard
//         </h1>
//         <p className="text-gray-600">
//           Real-time monitoring and analytics
//         </p>
//       </div>

//       {/* Stats Grid */}
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
//         <StatCard
//           title="Total Transactions"
//           value={stats.totalTransactions}
//           change="+12.5%"
//           icon={Activity}
//         />
//         <StatCard
//           title="Fraud Detected"
//           value={stats.fraudDetected}
//           change="+8.3%"
//           icon={AlertTriangle}
//           trend="down"
//         />
//         <StatCard
//           title="Accuracy Rate"
//           value={stats.accuracyRate}
//           change="+0.2%"
//           icon={TrendingUp}
//           suffix="%"
//         />
//         <StatCard
//           title="Amount Blocked"
//           value={`$${(stats.blockedAmount / 1000).toFixed(0)}K`}
//           change="+15.7%"
//           icon={DollarSign}
//         />
//       </div>

//       {/* Additional Stats */}
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
//         <StatCard
//           title="Active Users"
//           value={stats.totalUsers}
//           change="+3.2%"
//           icon={Users}
//         />
//         <StatCard
//           title="Suspicious Users"
//           value={stats.suspiciousUsers}
//           change="-5.1%"
//           icon={Shield}
//           trend="down"
//         />
//         <StatCard
//           title="False Positives"
//           value={stats.falsePositives}
//           change="-12.4%"
//           icon={AlertTriangle}
//           trend="down"
//         />
//         <StatCard
//           title="System Uptime"
//           value={stats.systemUptime}
//           change="+0.01%"
//           icon={TrendingUp}
//           suffix="%"
//         />
//       </div>

//       {/* Recent Alerts */}
//       <div className="bg-white rounded-lg shadow-sm border">
//         <div className="p-6 border-b">
//           <h2 className="text-lg font-semibold text-gray-900">
//             Recent Alerts
//           </h2>
//           <p className="text-sm text-gray-600">
//             Latest fraud detection alerts and system notifications
//           </p>
//         </div>
//         <div className="p-6">
//           <div className="space-y-4">
//             {recentAlerts.map(alert => (
//               <div
//                 key={alert.id}
//                 className={`p-4 rounded-lg border ${getAlertColor(alert.severity)}`}
//               >
//                 <div className="flex items-start justify-between">
//                   <div className="flex-1">
//                     <p className="font-medium">{alert.message}</p>
//                     <p className="text-sm opacity-70 mt-1">
//                       {new Date(alert.timestamp).toLocaleString()}
//                     </p>
//                   </div>
//                   <span className="ml-4 px-2 py-1 text-xs font-medium bg-white bg-opacity-50 rounded-full">
//                     {alert.type}
//                   </span>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>
//       </div>

//       {/* Real-time Chart Placeholder */}
//       <div className="bg-white rounded-lg shadow-sm border">
//         <div className="p-6 border-b">
//           <h2 className="text-lg font-semibold text-gray-900">
//             Transaction Volume
//           </h2>
//           <p className="text-sm text-gray-600">
//             Real-time transaction processing and fraud detection rates
//           </p>
//         </div>
//         <div className="p-6">
//           <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
//             <div className="text-center">
//               <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
//               <p className="text-gray-500">
//                 Real-time charts will be displayed here
//               </p>
//               <p className="text-sm text-gray-400">
//                 Integration with charting library pending
//               </p>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }


// // C:\Users\aanus\Downloads\AutheTrack\AutheTrack\client\src\components\Dashboard.tsx
// import React, { useState, useEffect } from 'react';
// import { Shield, TrendingUp, AlertTriangle, Users, Activity, DollarSign } from 'lucide-react';
// import { useRealTimeData } from '../hooks/useRealTimeData';

// interface DashboardStats {
//   totalTransactions: number;
//   fraudDetected: number;
//   falsePositives: number;
//   accuracyRate: number;
//   totalUsers: number;
//   suspiciousUsers: number;
//   blockedAmount: number;
//   systemUptime: number;
// }

// interface AlertItem {
//   id: string;
//   type: 'fraud' | 'suspicious' | 'system';
//   message: string;
//   timestamp: string;
//   severity: 'high' | 'medium' | 'low';
// }

// interface RealTimeData {
//   stats?: Partial<DashboardStats>;
//   alerts?: AlertItem[];
// }

// export default function Dashboard() {
//   const [stats, setStats] = useState<DashboardStats>({
//     totalTransactions: 45284,
//     fraudDetected: 1247,
//     falsePositives: 89,
//     accuracyRate: 97.8,
//     totalUsers: 12456,
//     suspiciousUsers: 34,
//     blockedAmount: 284750,
//     systemUptime: 99.94
//   });

//   const [recentAlerts, setRecentAlerts] = useState<AlertItem[]>([
//     {
//       id: 'alert_initial_1',
//       type: 'fraud',
//       message: 'High-risk transaction detected: $15,000 from anomalous location',
//       timestamp: new Date().toISOString(),
//       severity: 'high'
//     },
//     {
//       id: 'alert_initial_2',
//       type: 'suspicious',
//       message: 'Multiple login attempts from user ID: 7892',
//       timestamp: new Date(Date.now() - 300000).toISOString(),
//       severity: 'medium'
//     },
//     {
//       id: 'alert_initial_3',
//       type: 'system',
//       message: 'ML model accuracy improved to 97.8%',
//       timestamp: new Date(Date.now() - 600000).toISOString(),
//       severity: 'low'
//     }
//   ]);

//   const realTimeData = useRealTimeData() as unknown as RealTimeData;

//   useEffect(() => {
//     if (realTimeData?.stats) {
//       setStats(prev => ({ ...prev, ...realTimeData.stats }));
//     }
//     if (realTimeData?.alerts && realTimeData.alerts.length > 0) {
//       setRecentAlerts(prev => {
//         const newAlerts = realTimeData.alerts!;
//         const existingIds = new Set(prev.map(alert => alert.id));
//         const uniqueNewAlerts = newAlerts.filter(alert => !existingIds.has(alert.id));
//         return [...uniqueNewAlerts, ...prev].slice(0, 10);
//       });
//     }
//   }, [realTimeData]);

//   const StatCard = ({
//     title,
//     value,
//     change,
//     icon: Icon,
//     trend = 'up',
//     suffix = ''
//   }: {
//     title: string;
//     value: number | string;
//     change: string;
//     icon: React.ComponentType<{ className?: string }>;
//     trend?: 'up' | 'down';
//     suffix?: string;
//   }) => (
//     <div className="bg-white p-6 rounded-lg shadow-sm border">
//       <div className="flex items-center justify-between">
//         <div>
//           <p className="text-sm font-medium text-gray-600">{title}</p>
//           <p className="text-2xl font-semibold text-gray-900">
//             {typeof value === 'number' ? value.toLocaleString() : value}
//             {suffix}
//           </p>
//         </div>
//         <div
//           className={`p-3 rounded-full ${
//             Icon === Shield
//               ? 'bg-blue-100'
//               : Icon === TrendingUp
//               ? 'bg-green-100'
//               : Icon === AlertTriangle
//               ? 'bg-red-100'
//               : Icon === Users
//               ? 'bg-purple-100'
//               : 'bg-gray-100'
//           }`}
//         >
//           <Icon
//             className={`h-6 w-6 ${
//               Icon === Shield
//                 ? 'text-blue-600'
//                 : Icon === TrendingUp
//                 ? 'text-green-600'
//                 : Icon === AlertTriangle
//                 ? 'text-red-600'
//                 : Icon === Users
//                 ? 'text-purple-600'
//                 : 'text-gray-600'
//             }`}
//           />
//         </div>
//       </div>
//       <div className="mt-4 flex items-center">
//         <span
//           className={`text-sm font-medium ${
//             trend === 'up' ? 'text-green-600' : 'text-red-600'
//           }`}
//         >
//           {change}
//         </span>
//         <span className="text-sm text-gray-500 ml-2">from last hour</span>
//       </div>
//     </div>
//   );

//   const getAlertColor = (severity: string) => {
//     switch (severity) {
//       case 'high':
//         return 'bg-red-50 border-red-200 text-red-800';
//       case 'medium':
//         return 'bg-yellow-50 border-yellow-200 text-yellow-800';
//       case 'low':
//         return 'bg-green-50 border-green-200 text-green-800';
//       default:
//         return 'bg-gray-50 border-gray-200 text-gray-800';
//     }
//   };

//   return (
//     <div className="space-y-6">
//       <div>
//         <h1 className="text-2xl font-bold text-gray-900">
//           Fraud Detection Dashboard
//         </h1>
//         <p className="text-gray-600">
//           Real-time monitoring and analytics
//         </p>
//       </div>

//       {/* Stats Grid */}
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
//         <StatCard
//           title="Total Transactions"
//           value={stats.totalTransactions}
//           change="+12.5%"
//           icon={Activity}
//         />
//         <StatCard
//           title="Fraud Detected"
//           value={stats.fraudDetected}
//           change="+8.3%"
//           icon={AlertTriangle}
//           trend="down"
//         />
//         <StatCard
//           title="Accuracy Rate"
//           value={stats.accuracyRate}
//           change="+0.2%"
//           icon={TrendingUp}
//           suffix="%"
//         />
//         <StatCard
//           title="Amount Blocked"
//           value={`$${(stats.blockedAmount / 1000).toFixed(0)}K`}
//           change="+15.7%"
//           icon={DollarSign}
//         />
//       </div>

//       {/* Additional Stats */}
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
//         <StatCard
//           title="Active Users"
//           value={stats.totalUsers}
//           change="+3.2%"
//           icon={Users}
//         />
//         <StatCard
//           title="Suspicious Users"
//           value={stats.suspiciousUsers}
//           change="-5.1%"
//           icon={Shield}
//           trend="down"
//         />
//         <StatCard
//           title="False Positives"
//           value={stats.falsePositives}
//           change="-12.4%"
//           icon={AlertTriangle}
//           trend="down"
//         />
//         <StatCard
//           title="System Uptime"
//           value={stats.systemUptime}
//           change="+0.01%"
//           icon={TrendingUp}
//           suffix="%"
//         />
//       </div>

//       {/* Recent Alerts */}
//       <div className="bg-white rounded-lg shadow-sm border">
//         <div className="p-6 border-b">
//           <h2 className="text-lg font-semibold text-gray-900">
//             Recent Alerts
//           </h2>
//           <p className="text-sm text-gray-600">
//             Latest fraud detection alerts and system notifications
//           </p>
//         </div>
//         <div className="p-6">
//           <div className="space-y-4">
//             {recentAlerts.map(alert => (
//               <div
//                 key={alert.id}
//                 className={`p-4 rounded-lg border ${getAlertColor(alert.severity)}`}
//               >
//                 <div className="flex items-start justify-between">
//                   <div className="flex-1">
//                     <p className="font-medium">{alert.message}</p>
//                     <p className="text-sm opacity-70 mt-1">
//                       {new Date(alert.timestamp).toLocaleString()}
//                     </p>
//                   </div>
//                   <span className="ml-4 px-2 py-1 text-xs font-medium bg-white bg-opacity-50 rounded-full">
//                     {alert.type}
//                   </span>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>
//       </div>

//       {/* Real-time Chart Placeholder */}
//       <div className="bg-white rounded-lg shadow-sm border">
//         <div className="p-6 border-b">
//           <h2 className="text-lg font-semibold text-gray-900">
//             Transaction Volume
//           </h2>
//           <p className="text-sm text-gray-600">
//             Real-time transaction processing and fraud detection rates
//           </p>
//         </div>
//         <div className="p-6">
//           <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
//             <div className="text-center">
//               <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
//               <p className="text-gray-500">
//                 Real-time charts will be displayed here
//               </p>
//               <p className="text-sm text-gray-400">
//                 Integration with charting library pending
//               </p>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }


import React, { useState, useEffect } from 'react';
import { Shield, TrendingUp, AlertTriangle, Users, Activity, DollarSign } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
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

interface AlertItem {
  id: string;
  type: 'fraud' | 'suspicious' | 'system';
  message: string;
  timestamp: string;
  severity: 'high' | 'medium' | 'low';
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
      id: 'alert_initial_1',
      type: 'fraud',
      message: 'High-risk transaction detected: $15,000 from anomalous location',
      timestamp: new Date().toISOString(),
      severity: 'high'
    },
    {
      id: 'alert_initial_2',
      type: 'suspicious',
      message: 'Multiple login attempts from user ID: 7892',
      timestamp: new Date(Date.now() - 300000).toISOString(),
      severity: 'medium'
    },
    {
      id: 'alert_initial_3',
      type: 'system',
      message: 'ML model accuracy improved to 97.8%',
      timestamp: new Date(Date.now() - 600000).toISOString(),
      severity: 'low'
    }
  ]);

  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [riskDistribution, setRiskDistribution] = useState<RiskDistributionData[]>([
    { name: 'Low Risk', value: 75, color: '#10B981' },
    { name: 'Medium Risk', value: 20, color: '#F59E0B' },
    { name: 'High Risk', value: 5, color: '#EF4444' }
  ]);

  const realTimeData = useRealTimeData();

  // Initialize chart data
  useEffect(() => {
    const now = new Date();
    const initialData: ChartData[] = [];
    
    for (let i = 23; i >= 0; i--) {
      const time = new Date(now.getTime() - i * 60 * 60 * 1000);
      initialData.push({
        time: time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        transactions: Math.floor(Math.random() * 500) + 200,
        fraudDetected: Math.floor(Math.random() * 25) + 5,
        riskScore: Math.random() * 0.3 + 0.1
      });
    }
    
    setChartData(initialData);
  }, []);

  // Update data from real-time service
  useEffect(() => {
    if (realTimeData?.stats) {
      setStats(prev => ({ ...prev, ...realTimeData.stats }));
    }
    
    if (realTimeData?.alerts && realTimeData.alerts.length > 0) {
      setRecentAlerts(prev => {
        const newAlerts = realTimeData.alerts!.map(alert => ({
          id: alert.id,
          type: alert.type,
          message: alert.title || alert.description,
          timestamp: alert.timestamp,
          severity: alert.severity === 'critical' ? 'high' : alert.severity as 'high' | 'medium' | 'low'
        }));
        
        const existingIds = new Set(prev.map(alert => alert.id));
        const uniqueNewAlerts = newAlerts.filter(alert => !existingIds.has(alert.id));
        return [...uniqueNewAlerts, ...prev].slice(0, 10);
      });
    }

    // Update chart data with real-time transaction data
    if (realTimeData?.transactions && realTimeData.transactions.length > 0) {
      const newTransaction = realTimeData.transactions[0];
      const now = new Date();
      
      setChartData(prev => {
        const updated = [...prev];
        const newPoint: ChartData = {
          time: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          transactions: updated[updated.length - 1]?.transactions + 1 || 1,
          fraudDetected: newTransaction.fraudPrediction ? 
            (updated[updated.length - 1]?.fraudDetected || 0) + 1 : 
            (updated[updated.length - 1]?.fraudDetected || 0),
          riskScore: newTransaction.riskScore
        };
        
        // Keep only last 24 hours of data
        const result = [...updated.slice(1), newPoint];
        return result;
      });

      // Update risk distribution based on new data
      const riskLevel = newTransaction.riskScore > 0.7 ? 'High Risk' : 
                       newTransaction.riskScore > 0.3 ? 'Medium Risk' : 'Low Risk';
      
      setRiskDistribution(prev => {
        const updated = prev.map(item => {
          if (item.name === riskLevel) {
            return { ...item, value: item.value + 1 };
          }
          return item;
        });
        
        // Normalize to percentages
        const total = updated.reduce((sum, item) => sum + item.value, 0);
        return updated.map(item => ({
          ...item,
          value: Math.round((item.value / total) * 100)
        }));
      });
    }
  }, [realTimeData]);

  const StatCard = ({
    title,
    value,
    change,
    icon: Icon,
    trend = 'up',
    suffix = ''
  }: {
    title: string;
    value: number | string;
    change: string;
    icon: React.ComponentType<{ className?: string }>;
    trend?: 'up' | 'down';
    suffix?: string;
  }) => (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">
            {typeof value === 'number' ? value.toLocaleString() : value}
            {suffix}
          </p>
        </div>
        <div
          className={`p-3 rounded-full ${
            Icon === Shield
              ? 'bg-blue-100'
              : Icon === TrendingUp
              ? 'bg-green-100'
              : Icon === AlertTriangle
              ? 'bg-red-100'
              : Icon === Users
              ? 'bg-purple-100'
              : 'bg-gray-100'
          }`}
        >
          <Icon
            className={`h-6 w-6 ${
              Icon === Shield
                ? 'text-blue-600'
                : Icon === TrendingUp
                ? 'text-green-600'
                : Icon === AlertTriangle
                ? 'text-red-600'
                : Icon === Users
                ? 'text-purple-600'
                : 'text-gray-600'
            }`}
          />
        </div>
      </div>
      <div className="mt-4 flex items-center">
        <span
          className={`text-sm font-medium ${
            trend === 'up' ? 'text-green-600' : 'text-red-600'
          }`}
        >
          {change}
        </span>
        <span className="text-sm text-gray-500 ml-2">from last hour</span>
      </div>
    </div>
  );

  const getAlertColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'medium':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'low':
        return 'bg-green-50 border-green-200 text-green-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Fraud Detection Dashboard
        </h1>
        <p className="text-gray-600">
          Real-time monitoring and analytics
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Transactions"
          value={stats.totalTransactions}
          change="+12.5%"
          icon={Activity}
        />
        <StatCard
          title="Fraud Detected"
          value={stats.fraudDetected}
          change="+8.3%"
          icon={AlertTriangle}
          trend="down"
        />
        <StatCard
          title="Accuracy Rate"
          value={stats.accuracyRate}
          change="+0.2%"
          icon={TrendingUp}
          suffix="%"
        />
        <StatCard
          title="Amount Blocked"
          value={`$${(stats.blockedAmount / 1000).toFixed(0)}K`}
          change="+15.7%"
          icon={DollarSign}
        />
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Active Users"
          value={stats.totalUsers}
          change="+3.2%"
          icon={Users}
        />
        <StatCard
          title="Suspicious Users"
          value={stats.suspiciousUsers}
          change="-5.1%"
          icon={Shield}
          trend="down"
        />
        <StatCard
          title="False Positives"
          value={stats.falsePositives}
          change="-12.4%"
          icon={AlertTriangle}
          trend="down"
        />
        <StatCard
          title="System Uptime"
          value={stats.systemUptime}
          change="+0.01%"
          icon={TrendingUp}
          suffix="%"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Transaction Volume Chart */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-900">
              Transaction Volume & Fraud Detection
            </h2>
            <p className="text-sm text-gray-600">
              Real-time transaction processing and fraud detection rates
            </p>
          </div>
          <div className="p-6">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="transactions"
                  stackId="1"
                  stroke="#3B82F6"
                  fill="#3B82F6"
                  fillOpacity={0.6}
                  name="Total Transactions"
                />
                <Area
                  type="monotone"
                  dataKey="fraudDetected"
                  stackId="2"
                  stroke="#EF4444"
                  fill="#EF4444"
                  fillOpacity={0.8}
                  name="Fraud Detected"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Risk Score Trend */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-900">
              Average Risk Score Trend
            </h2>
            <p className="text-sm text-gray-600">
              ML model risk assessment over time
            </p>
          </div>
          <div className="p-6">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis domain={[0, 1]} />
                <Tooltip 
                  formatter={(value) => [`${(Number(value) * 100).toFixed(1)}%`, 'Risk Score']}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="riskScore"
                  stroke="#F59E0B"
                  strokeWidth={3}
                  dot={{ fill: '#F59E0B', strokeWidth: 2, r: 4 }}
                  name="Risk Score"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Risk Distribution and Recent Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Risk Distribution */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-900">
              Risk Distribution
            </h2>
            <p className="text-sm text-gray-600">
              Transaction risk levels breakdown
            </p>
          </div>
          <div className="p-6">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={riskDistribution}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}%`}
                >
                  {riskDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Alerts */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Recent Alerts
                </h2>
                <p className="text-sm text-gray-600">
                  Latest fraud detection alerts and system notifications
                </p>
              </div>
              {realTimeData.isConnected && (
                <div className="flex items-center text-green-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                  <span className="text-sm">Live</span>
                </div>
              )}
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4 max-h-64 overflow-y-auto">
              {recentAlerts.map(alert => (
                <div
                  key={alert.id}
                  className={`p-4 rounded-lg border ${getAlertColor(alert.severity)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium">{alert.message}</p>
                      <p className="text-sm opacity-70 mt-1">
                        {new Date(alert.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <span className="ml-4 px-2 py-1 text-xs font-medium bg-white bg-opacity-50 rounded-full">
                      {alert.type}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Connection Status */}
      {!realTimeData.isConnected && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
            <p className="text-yellow-800">
              Real-time connection lost. Displaying cached data.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}