// C:\Users\aanus\Downloads\AutheTrack\AutheTrack\client\src\components\Transactions.tsx
import React, { useState } from 'react';
import { Search, Eye, AlertTriangle, CheckCircle, Clock, DollarSign } from 'lucide-react';

interface Transaction {
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

export default function Transactions() {
  const [transactions] = useState<Transaction[]>([
    {
      id: 'txn_001',
      userId: 'user_12345',
      amount: 15000,
      currency: 'USD',
      location: 'New York, NY',
      device: 'iPhone 15 Pro',
      timestamp: new Date().toISOString(),
      riskScore: 0.95,
      status: 'declined',
      fraudPrediction: true,
      flags: ['high_amount', 'new_device', 'unusual_location']
    },
    {
      id: 'txn_002',
      userId: 'user_67890',
      amount: 250,
      currency: 'USD',
      location: 'Los Angeles, CA',
      device: 'Samsung Galaxy S24',
      timestamp: new Date(Date.now() - 300000).toISOString(),
      riskScore: 0.12,
      status: 'approved',
      fraudPrediction: false,
      flags: []
    },
    {
      id: 'txn_003',
      userId: 'user_11111',
      amount: 5000,
      currency: 'USD',
      location: 'Chicago, IL',
      device: 'MacBook Pro',
      timestamp: new Date(Date.now() - 600000).toISOString(),
      riskScore: 0.67,
      status: 'pending',
      fraudPrediction: false,
      flags: ['off_hours']
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  const getRiskColor = (riskScore: number) => {
    if (riskScore >= 0.8) return 'text-red-600 bg-red-50';
    if (riskScore >= 0.5) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'declined': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'declined': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'pending': return <Clock className="h-4 w-4 text-yellow-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.userId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || transaction.status === statusFilter;
    
    let matchesRisk = true;
    if (riskFilter === 'high') matchesRisk = transaction.riskScore >= 0.8;
    else if (riskFilter === 'medium') matchesRisk = transaction.riskScore >= 0.5 && transaction.riskScore < 0.8;
    else if (riskFilter === 'low') matchesRisk = transaction.riskScore < 0.5;
    
    return matchesSearch && matchesStatus && matchesRisk;
  });

  const TransactionModal = ({ transaction, onClose }: { transaction: Transaction; onClose: () => void }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-3xl w-full m-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <DollarSign className="h-6 w-6 text-blue-600" />
              <div className="ml-3">
                <h2 className="text-xl font-semibold">Transaction Details</h2>
                <p className="text-sm text-gray-600">ID: {transaction.id}</p>
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
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Amount</label>
              <p className="mt-1 text-2xl font-bold text-gray-900">
                {transaction.currency} ${transaction.amount.toLocaleString()}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <div className="mt-1 flex items-center">
                {getStatusIcon(transaction.status)}
                <span className={`ml-2 px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(transaction.status)}`}>
                  {transaction.status}
                </span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Risk Score</label>
              <div className={`mt-1 inline-flex px-3 py-1 rounded-full text-sm font-medium ${getRiskColor(transaction.riskScore)}`}>
                {(transaction.riskScore * 100).toFixed(1)}%
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Fraud Prediction</label>
              <p className="mt-1 text-sm text-gray-900">
                {transaction.fraudPrediction ? (
                  <span className="text-red-600 font-medium">Flagged as Fraud</span>
                ) : (
                  <span className="text-green-600 font-medium">Legitimate</span>
                )}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">User ID</label>
              <p className="mt-1 text-sm text-gray-900 font-mono">{transaction.userId}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Timestamp</label>
              <p className="mt-1 text-sm text-gray-900">
                {new Date(transaction.timestamp).toLocaleString()}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Location</label>
              <p className="mt-1 text-sm text-gray-900">{transaction.location}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Device</label>
              <p className="mt-1 text-sm text-gray-900">{transaction.device}</p>
            </div>
          </div>

          {transaction.flags.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Risk Flags</label>
              <div className="flex flex-wrap gap-2">
                {transaction.flags.map((flag, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded border border-red-200"
                  >
                    {flag.replace('_', ' ')}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t bg-gray-50 flex justify-end">
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
        <p className="text-gray-600">Monitor and analyze transaction data</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-semibold text-gray-900">{transactions.length}</p>
              <p className="text-sm text-gray-600">Total Transactions</p>
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
                {transactions.filter(t => t.status === 'approved').length}
              </p>
              <p className="text-sm text-gray-600">Approved</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-semibold text-gray-900">
                {transactions.filter(t => t.status === 'declined').length}
              </p>
              <p className="text-sm text-gray-600">Declined</p>
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
                {transactions.filter(t => t.status === 'pending').length}
              </p>
              <p className="text-sm text-gray-600">Pending</p>
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
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            title="Filter by status"
          >
            <option value="all">All Statuses</option>
            <option value="approved">Approved</option>
            <option value="declined">Declined</option>
            <option value="pending">Pending</option>
          </select>

          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            title="Filter by risk level"
          >
            <option value="all">All Risk Levels</option>
            <option value="high">High Risk (80%+)</option>
            <option value="medium">Medium Risk (50-80%)</option>
            <option value="low">Low Risk (&lt;50%)</option>
          </select>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Transaction
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Risk Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTransactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{transaction.id}</div>
                      <div className="text-sm text-gray-500">User: {transaction.userId}</div>
                      {transaction.fraudPrediction && (
                        <div className="text-xs text-red-600 font-medium">Fraud Flagged</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {transaction.currency} ${transaction.amount.toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getStatusIcon(transaction.status)}
                      <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(transaction.status)}`}>
                        {transaction.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRiskColor(transaction.riskScore)}`}>
                      {(transaction.riskScore * 100).toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {transaction.location}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(transaction.timestamp).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => setSelectedTransaction(transaction)}
                      className="text-blue-600 hover:text-blue-900 flex items-center"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredTransactions.length === 0 && (
            <div className="p-12 text-center">
              <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No transactions found matching your criteria</p>
            </div>
          )}
        </div>
      </div>

      {/* Transaction Details Modal */}
      {selectedTransaction && (
        <TransactionModal
          transaction={selectedTransaction}
          onClose={() => setSelectedTransaction(null)}
        />
      )}
    </div>
  );
}