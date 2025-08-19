import React, { useState } from 'react';
import { Search, Eye, Shield, AlertTriangle, Users as UsersIcon, User } from 'lucide-react';

interface UserData {
  id: string;
  name: string;
  email: string;
  accountType: string;
  location: string;
  registrationDate: string;
  riskLevel: 'low' | 'medium' | 'high';
  transactionCount: number;
  averageAmount: number;
  lastLogin: string;
  status: 'active' | 'suspended' | 'pending';
}

export default function Users() {
  const [users, setUsers] = useState<UserData[]>([
    {
      id: 'user_12345',
      name: 'John Doe',
      email: 'john.doe@email.com',
      accountType: 'Premium',
      location: 'New York, NY',
      registrationDate: '2023-01-15',
      riskLevel: 'high',
      transactionCount: 245,
      averageAmount: 1250,
      lastLogin: new Date().toISOString(),
      status: 'active'
    },
    {
      id: 'user_67890',
      name: 'Jane Smith',
      email: 'jane.smith@email.com',
      accountType: 'Standard',
      location: 'Los Angeles, CA',
      registrationDate: '2023-03-22',
      riskLevel: 'medium',
      transactionCount: 89,
      averageAmount: 450,
      lastLogin: new Date(Date.now() - 86400000).toISOString(),
      status: 'active'
    },
    {
      id: 'user_11111',
      name: 'Mike Johnson',
      email: 'mike.johnson@email.com',
      accountType: 'Standard',
      location: 'Chicago, IL',
      registrationDate: '2023-05-10',
      riskLevel: 'low',
      transactionCount: 156,
      averageAmount: 320,
      lastLogin: new Date(Date.now() - 172800000).toISOString(),
      status: 'active'
    },
    {
      id: 'user_22222',
      name: 'Sarah Wilson',
      email: 'sarah.wilson@email.com',
      accountType: 'Premium',
      location: 'Houston, TX',
      registrationDate: '2023-02-08',
      riskLevel: 'high',
      transactionCount: 312,
      averageAmount: 2100,
      lastLogin: new Date(Date.now() - 3600000).toISOString(),
      status: 'suspended'
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRisk = riskFilter === 'all' || user.riskLevel === riskFilter;
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    
    return matchesSearch && matchesRisk && matchesStatus;
  });

  const UserModal = ({ user, onClose }: { user: UserData; onClose: () => void }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-3xl w-full m-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <User className="h-6 w-6 text-blue-600" />
              <div className="ml-3">
                <h2 className="text-xl font-semibold">{user.name}</h2>
                <p className="text-sm text-gray-600">{user.email}</p>
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
              <label className="block text-sm font-medium text-gray-700">User ID</label>
              <p className="mt-1 text-sm text-gray-900 font-mono">{user.id}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Account Type</label>
              <p className="mt-1 text-sm text-gray-900">{user.accountType}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Risk Level</label>
              <span className={`mt-1 inline-flex px-2 py-1 text-xs font-medium rounded-full ${getRiskColor(user.riskLevel)}`}>
                {user.riskLevel}
              </span>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <span className={`mt-1 inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(user.status)}`}>
                {user.status}
              </span>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Location</label>
              <p className="mt-1 text-sm text-gray-900">{user.location}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Registration Date</label>
              <p className="mt-1 text-sm text-gray-900">
                {new Date(user.registrationDate).toLocaleDateString()}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Transaction Count</label>
              <p className="mt-1 text-sm text-gray-900">{user.transactionCount.toLocaleString()}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Average Amount</label>
              <p className="mt-1 text-sm text-gray-900">${user.averageAmount.toLocaleString()}</p>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700">Last Login</label>
              <p className="mt-1 text-sm text-gray-900">
                {new Date(user.lastLogin).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 border-t bg-gray-50 flex justify-between">
          <div className="flex space-x-2">
            {user.status === 'active' && (
              <button className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700">
                Suspend User
              </button>
            )}
            {user.status === 'suspended' && (
              <button className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700">
                Reactivate User
              </button>
            )}
            <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
              View Transactions
            </button>
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Users</h1>
        <p className="text-gray-600">Manage user accounts and risk profiles</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <UsersIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-semibold text-gray-900">{users.length}</p>
              <p className="text-sm text-gray-600">Total Users</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Shield className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-semibold text-gray-900">
                {users.filter(u => u.riskLevel === 'low').length}
              </p>
              <p className="text-sm text-gray-600">Low Risk</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-semibold text-gray-900">
                {users.filter(u => u.riskLevel === 'medium').length}
              </p>
              <p className="text-sm text-gray-600">Medium Risk</p>
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
                {users.filter(u => u.riskLevel === 'high').length}
              </p>
              <p className="text-sm text-gray-600">High Risk</p>
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
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            title="Filter by risk level"
          >
            <option value="all">All Risk Levels</option>
            <option value="low">Low Risk</option>
            <option value="medium">Medium Risk</option>
            <option value="high">High Risk</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            title="Filter by status"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="pending">Pending</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Account Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Risk Level
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Transactions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Login
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-gray-600" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                        <div className="text-xs text-gray-400">{user.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.accountType}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRiskColor(user.riskLevel)}`}>
    {user.riskLevel}
  </span>
</td>
<td className="px-6 py-4 whitespace-nowrap">
  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(user.status)}`}>
    {user.status}
  </span>
</td>
<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
  {user.transactionCount.toLocaleString()}
</td>
<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
  {new Date(user.lastLogin).toLocaleString()}
</td>
<td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
  <button
    onClick={() => setSelectedUser(user)}
    className="text-blue-600 hover:text-blue-900"
  >
    <Eye className="h-5 w-5 inline" /> View
  </button>
</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Modal */}
      {selectedUser && (
        <UserModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
        />
      )}
    </div>
  );
}
