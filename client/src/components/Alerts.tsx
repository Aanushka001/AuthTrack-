import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, Clock, X, Filter, Search } from 'lucide-react';
import { useRealTimeData } from '../hooks/useRealTimeData';

interface Alert {
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

export default function Alerts() {
  const [alerts, setAlerts] = useState<Alert[]>([
    {
      id: 'alert_001',
      type: 'fraud',
      severity: 'critical',
      title: 'High-Risk Transaction Detected',
      description: 'Transaction of $15,000 from unusual location with mismatched device fingerprint',
      timestamp: new Date().toISOString(),
      status: 'active',
      userId: 'user_12345',
      transactionId: 'txn_001',
      riskScore: 0.95,
      location: 'Unknown Location'
    },
    {
      id: 'alert_002',
      type: 'account_sharing',
      severity: 'high',
      title: 'Account Sharing Detected',
      description: 'Multiple simultaneous logins from different countries detected for user account',
      timestamp: new Date(Date.now() - 900000).toISOString(),
      status: 'acknowledged',
      userId: 'user_67890',
      riskScore: 0.88,
      location: 'Multiple Locations',
      assignedTo: 'fraud_team'
    },
    {
      id: 'alert_003',
      type: 'suspicious',
      severity: 'medium',
      title: 'Unusual Login Pattern',
      description: 'User logged in at 3:00 AM from new device, different from usual pattern',
      timestamp: new Date(Date.now() - 1800000).toISOString(),
      status: 'resolved',
      userId: 'user_11111',
      riskScore: 0.65,
      location: 'Chicago, IL',
      actionTaken: 'User verified via SMS'
    },
    {
      id: 'alert_004',
      type: 'system',
      severity: 'low',
      title: 'Model Performance Update',
      description: 'Fraud detection model accuracy improved to 97.8% after latest training cycle',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      status: 'acknowledged',
      actionTaken: 'Model deployed to production'
    }
  ]);

  const [filteredAlerts, setFilteredAlerts] = useState(alerts);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);

  const realTimeData = useRealTimeData();

  useEffect(() => {
    // Safely handle real-time alerts updates
    if (realTimeData?.alerts && Array.isArray(realTimeData.alerts) && realTimeData.alerts.length > 0) {
      setAlerts(prev => [...realTimeData.alerts!, ...prev].slice(0, 100));
    }
  }, [realTimeData?.alerts]);

  useEffect(() => {
    let filtered = alerts.filter(alert => {
      const matchesSearch = alert.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           alert.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           alert.userId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           alert.transactionId?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesType = typeFilter === 'all' || alert.type === typeFilter;
      const matchesSeverity = severityFilter === 'all' || alert.severity === severityFilter;
      const matchesStatus = statusFilter === 'all' || alert.status === statusFilter;
      
      return matchesSearch && matchesType && matchesSeverity && matchesStatus;
    });

    setFilteredAlerts(filtered);
  }, [alerts, searchTerm, typeFilter, severityFilter, statusFilter]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-red-100 text-red-800';
      case 'acknowledged': return 'bg-yellow-100 text-yellow-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'dismissed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'fraud': return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'suspicious': return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      case 'account_sharing': return <AlertTriangle className="h-5 w-5 text-purple-500" />;
      case 'system': return <CheckCircle className="h-5 w-5 text-blue-500" />;
      default: return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const handleUpdateStatus = (alertId: string, newStatus: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId 
        ? { ...alert, status: newStatus as Alert['status'], assignedTo: newStatus === 'acknowledged' ? 'current_user' : alert.assignedTo }
        : alert
    ));
  };

  const AlertModal = ({ alert, onClose }: { alert: Alert; onClose: () => void }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full m-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {getTypeIcon(alert.type)}
              <div className="ml-3">
                <h2 className="text-xl font-semibold">{alert.title}</h2>
                <div className="flex items-center mt-1 space-x-2">
                  <span className={`px-2 py-1 text-xs font-medium rounded border ${getSeverityColor(alert.severity)}`}>
                    {alert.severity}
                  </span>
                  <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(alert.status)}`}>
                    {alert.status}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>
        </div>
        
        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <p className="text-gray-900">{alert.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Alert Type</label>
              <p className="mt-1 text-sm text-gray-900 capitalize">{alert.type.replace('_', ' ')}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Timestamp</label>
              <p className="mt-1 text-sm text-gray-900">
                {new Date(alert.timestamp).toLocaleString()}
              </p>
            </div>
            {alert.userId && (
              <div>
                <label className="block text-sm font-medium text-gray-700">User ID</label>
                <p className="mt-1 text-sm text-gray-900 font-mono">{alert.userId}</p>
              </div>
            )}
            {alert.transactionId && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Transaction ID</label>
                <p className="mt-1 text-sm text-gray-900 font-mono">{alert.transactionId}</p>
              </div>
            )}
            {alert.riskScore && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Risk Score</label>
                <p className="mt-1 text-sm text-gray-900">{(alert.riskScore * 100).toFixed(1)}%</p>
              </div>
            )}
            {alert.location && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Location</label>
                <p className="mt-1 text-sm text-gray-900">{alert.location}</p>
              </div>
            )}
            {alert.assignedTo && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Assigned To</label>
                <p className="mt-1 text-sm text-gray-900 capitalize">{alert.assignedTo.replace('_', ' ')}</p>
              </div>
            )}
            {alert.actionTaken && (
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700">Action Taken</label>
                <p className="mt-1 text-sm text-gray-900">{alert.actionTaken}</p>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 border-t bg-gray-50 flex justify-between">
          <div className="flex space-x-2">
            {alert.status === 'active' && (
              <button
                onClick={() => {
                  handleUpdateStatus(alert.id, 'acknowledged');
                  onClose();
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
              >
                Acknowledge
              </button>
            )}
            {alert.status !== 'resolved' && alert.status !== 'dismissed' && (
              <>
                <button
                  onClick={() => {
                    handleUpdateStatus(alert.id, 'resolved');
                    onClose();
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700"
                >
                  Mark Resolved
                </button>
                <button
                  onClick={() => {
                    handleUpdateStatus(alert.id, 'dismissed');
                    onClose();
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Dismiss
                </button>
              </>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );

  const getActiveAlertsCount = () => alerts.filter(alert => alert.status === 'active').length;
  const getCriticalAlertsCount = () => alerts.filter(alert => alert.severity === 'critical').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Alerts & Notifications</h1>
        <p className="text-gray-600">Monitor and manage security alerts</p>
      </div>

      {/* Alert Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-semibold text-gray-900">{getActiveAlertsCount()}</p>
              <p className="text-sm text-gray-600">Active Alerts</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-semibold text-gray-900">{getCriticalAlertsCount()}</p>
              <p className="text-sm text-gray-600">Critical Alerts</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-semibold text-gray-900">
                {alerts.filter(a => a.status === 'acknowledged').length}
              </p>
              <p className="text-sm text-gray-600">Acknowledged</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-semibold text-gray-900">
                {alerts.filter(a => a.status === 'resolved').length}
              </p>
              <p className="text-sm text-gray-600">Resolved</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search alerts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            title="Filter by alert type"
          >
            <option value="all">All Types</option>
            <option value="fraud">Fraud</option>
            <option value="suspicious">Suspicious</option>
            <option value="account_sharing">Account Sharing</option>
            <option value="system">System</option>
          </select>

          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            title="Filter by severity"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            title="Filter by status"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="acknowledged">Acknowledged</option>
            <option value="resolved">Resolved</option>
            <option value="dismissed">Dismissed</option>
          </select>
        </div>
      </div>

      {/* Alerts List */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="divide-y divide-gray-200">
          {filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className="p-6 hover:bg-gray-50 cursor-pointer"
              onClick={() => setSelectedAlert(alert)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  {getTypeIcon(alert.type)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="text-sm font-medium text-gray-900">{alert.title}</h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded border ${getSeverityColor(alert.severity)}`}>
                        {alert.severity}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2">{alert.description}</p>
                    <div className="flex items-center mt-2 space-x-4 text-xs text-gray-500">
                      <span>{new Date(alert.timestamp).toLocaleString()}</span>
                      {alert.userId && <span>User: {alert.userId}</span>}
                      {alert.transactionId && <span>Txn: {alert.transactionId}</span>}
                      {alert.riskScore && <span>Risk: {(alert.riskScore * 100).toFixed(1)}%</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(alert.status)}`}>
                    {alert.status}
                  </span>
                  {alert.status === 'active' && (
                    <div className="flex space-x-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUpdateStatus(alert.id, 'acknowledged');
                        }}
                        className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                        title="Acknowledge"
                      >
                        <CheckCircle className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUpdateStatus(alert.id, 'dismissed');
                        }}
                        className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                        title="Dismiss"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {filteredAlerts.length === 0 && (
            <div className="p-12 text-center">
              <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No alerts found matching your criteria</p>
            </div>
          )}
        </div>
      </div>

      {/* Alert Details Modal */}
      {selectedAlert && (
        <AlertModal
          alert={selectedAlert}
          onClose={() => setSelectedAlert(null)}
        />
      )}
    </div>
  );
}