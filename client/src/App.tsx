import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
export interface Transaction {
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

export interface User {
  id: string;
  email: string;
  name: string;
  accountType: string;
  location: string;
  registrationDate: string;
  riskLevel: 'low' | 'medium' | 'high';
  transactionCount: number;
  averageAmount: number;
}

export interface Alert {
  id: string;
  type: 'fraud' | 'security' | 'system';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: string;
  userId?: string;
  transactionId?: string;
  status: 'new' | 'investigating' | 'resolved';
}

export interface DashboardData {
  totalTransactions: number;
  fraudDetected: number;
  falsePositives: number;
  accuracy: number;
  recentTransactions: Transaction[];
  alerts: Alert[];
  riskDistribution: { level: string; count: number }[];
}

export interface MLFeatures {
  amount: number;
  hourOfDay: number;
  dayOfWeek: number;
  merchantRiskScore: number;
  accountAge: number;
  transactionCount1h: number;
  transactionCount24h: number;
  avgTransactionAmount: number;
  locationRiskScore: number;
  deviceRiskScore: number;
  timeSinceLastTransaction: number;
  paymentMethod: string;
  ipReputationScore: number;
  behavioralAnomalyScore: number;
  crossBorderTransaction: boolean;
}

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: { 'Content-Type': 'application/json' },
    });

    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('authToken');
      if (token) config.headers.Authorization = `Bearer ${token}`;
      return config;
    });

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          localStorage.removeItem('authToken');
        }
        return Promise.reject(error);
      }
    );
  }

  private async request<T>(endpoint: string, options: AxiosRequestConfig = {}): Promise<T> {
    const response = await this.client.request({ url: endpoint, ...options });
    return response.data;
  }

  async getDashboardData(): Promise<DashboardData> {
    return this.request<DashboardData>('/transactions/dashboard');
  }

  async getTransactions(page = 1, limit = 10) {
    return this.request<{ transactions: Transaction[]; total: number }>(
      `/transactions?page=${page}&limit=${limit}`
    );
  }

  async getTransaction(id: string) {
    return this.request<Transaction>(`/transactions/${id}`);
  }

  async analyzeTransaction(transactionData: Partial<Transaction>) {
    return this.request<{ riskScore: number; fraudPrediction: boolean; flags: string[] }>(
      '/fraud/analyze',
      { method: 'POST', data: transactionData }
    );
  }

  async analyzeFraudRisk(features: MLFeatures) {
    return this.request<{
      riskScore: number;
      fraudPrediction: boolean;
      confidence: number;
      explanation: { riskFactors: string[]; featureImportance: Record<string, number> };
    }>('/fraud/analyze', { method: 'POST', data: { features } });
  }

  async getUsers(page = 1, limit = 10) {
    return this.request<{ users: User[]; total: number }>(
      `/auth/users?page=${page}&limit=${limit}`
    );
  }

  async getUser(id: string) {
    return this.request<User>(`/auth/users/${id}`);
  }

  async getUserRiskProfile(id: string) {
    return this.request<{ riskLevel: string; factors: string[]; recommendations: string[] }>(
      `/risk/user/${id}`
    );
  }

  async getAlerts(page = 1, limit = 10) {
    return this.request<{ alerts: Alert[]; total: number }>(
      `/fraud/alerts?page=${page}&limit=${limit}`
    );
  }

  async updateAlertStatus(id: string, status: Alert['status']) {
    return this.request<Alert>(`/fraud/alerts/${id}`, { method: 'PATCH', data: { status } });
  }

  async getSystemHealth() {
    return this.request<{
      status: string;
      uptime: number;
      performance: object;
      mlService?: { status: string; isHealthy: boolean; modelVersion: string };
    }>('/admin/health');
  }

  async updateSettings(settings: object) {
    return this.request<{ success: boolean }>('/admin/settings', { method: 'PUT', data: settings });
  }

  async trainMLModel() {
    return this.request<{
      status: string;
      message: string;
      metrics?: { accuracy: number; precision: number; recall: number };
    }>('/admin/ml/train', { method: 'POST' });
  }

  async getMLModelStatus() {
    return this.request<{
      modelLoaded: boolean;
      modelVersion: string;
      lastTraining: string | null;
      performanceMetrics: object;
    }>('/admin/ml/status');
  }

  async login(email: string, password: string) {
    return this.request<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      data: { email, password },
    });
  }

  async register(userData: { email: string; password: string; name: string }) {
    return this.request<{ token: string; user: User }>('/auth/register', {
      method: 'POST',
      data: userData,
    });
  }

  async logout() {
    return this.request<{ success: boolean }>('/auth/logout', { method: 'POST' });
  }

  async verifyPayPalTransaction(transactionId: string) {
    return this.request<{ verified: boolean; details: object }>('/integrations/paypal/verify', {
      method: 'POST',
      data: { transactionId },
    });
  }

  async getDeviceFingerprint(fingerprintHash: string) {
    return this.request<{ deviceInfo: object; riskScore: number }>(
      `/integrations/device/${fingerprintHash}`
    );
  }

  async analyzeGeolocation(ipAddress: string) {
    return this.request<{ location: object; riskScore: number }>(
      '/integrations/geolocation/analyze',
      { method: 'POST', data: { ipAddress } }
    );
  }
}

export const apiService = new ApiService();
export default apiService;