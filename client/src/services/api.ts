// // C:\Users\aanus\Downloads\AutheTrack\AutheTrack\client\src\services\api.ts

// // import axios from 'axios';

// // const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// // export interface Transaction {
// //   id: string;
// //   userId: string;
// //   amount: number;
// //   currency: string;
// //   location: string;
// //   device: string;
// //   timestamp: string;
// //   riskScore: number;
// //   status: 'approved' | 'declined' | 'pending';
// //   fraudPrediction: boolean;
// //   flags: string[];
// // }

// // export interface User {
// //   id: string;
// //   email: string;
// //   name: string;
// //   accountType: string;
// //   location: string;
// //   registrationDate: string;
// //   riskLevel: 'low' | 'medium' | 'high';
// //   transactionCount: number;
// //   averageAmount: number;
// // }

// // export interface Alert {
// //   id: string;
// //   type: 'fraud' | 'security' | 'system';
// //   severity: 'low' | 'medium' | 'high' | 'critical';
// //   message: string;
// //   timestamp: string;
// //   userId?: string;
// //   transactionId?: string;
// //   status: 'new' | 'investigating' | 'resolved';
// // }

// // export interface DashboardData {
// //   totalTransactions: number;
// //   fraudDetected: number;
// //   falsePositives: number;
// //   accuracy: number;
// //   recentTransactions: Transaction[];
// //   alerts: Alert[];
// //   riskDistribution: { level: string; count: number }[];
// // }

// // class ApiService {
// //   private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
// //     const url = `${API_BASE_URL}${endpoint}`;
// //     const config = {
// //       headers: {
// //         'Content-Type': 'application/json',
// //         ...options.headers,
// //       },
// //       ...options,
// //     };

// //     try {
// //       const response = await fetch(url, config);
// //       if (!response.ok) {
// //         throw new Error(`HTTP error! status: ${response.status}`);
// //       }
// //       return await response.json();
// //     } catch (error) {
// //       console.error(`API request failed: ${endpoint}`, error);
// //       throw error;
// //     }
// //   }

// //   async getDashboardData(): Promise<DashboardData> {
// //     return this.request<DashboardData>('/dashboard');
// //   }

// //   async getTransactions(page = 1, limit = 10) {
// //     return this.request<{ transactions: Transaction[]; total: number }>(
// //       `/transactions?page=${page}&limit=${limit}`
// //     );
// //   }

// //   async getTransaction(id: string) {
// //     return this.request<Transaction>(`/transactions/${id}`);
// //   }

// //   async analyzeTransaction(transactionData: Partial<Transaction>) {
// //     return this.request<{ riskScore: number; fraudPrediction: boolean; flags: string[] }>(
// //       '/fraud/analyze',
// //       {
// //         method: 'POST',
// //         body: JSON.stringify(transactionData),
// //       }
// //     );
// //   }

// //   async getUsers(page = 1, limit = 10) {
// //     return this.request<{ users: User[]; total: number }>(`/users?page=${page}&limit=${limit}`);
// //   }

// //   async getUser(id: string) {
// //     return this.request<User>(`/users/${id}`);
// //   }

// //   async getUserRiskProfile(id: string) {
// //     return this.request<{ riskLevel: string; factors: string[]; recommendations: string[] }>(
// //       `/risk/user/${id}`
// //     );
// //   }

// //   async getAlerts(page = 1, limit = 10) {
// //     return this.request<{ alerts: Alert[]; total: number }>(`/alerts?page=${page}&limit=${limit}`);
// //   }

// //   async updateAlertStatus(id: string, status: Alert['status']) {
// //     return this.request<Alert>(`/alerts/${id}`, {
// //       method: 'PATCH',
// //       body: JSON.stringify({ status }),
// //     });
// //   }

// //   async getSystemHealth() {
// //     return this.request<{ status: string; uptime: number; performance: object }>('/admin/health');
// //   }

// //   async updateSettings(settings: object) {
// //     return this.request<{ success: boolean }>('/admin/settings', {
// //       method: 'PUT',
// //       body: JSON.stringify(settings),
// //     });
// //   }
// // }

// // export const api = axios.create({
// //   baseURL: 'http://localhost:5000',
// // });

// // export const apiService = new ApiService();
// // export default apiService;
// // export interface MLFeatures {
// //   transactionAmount: number;
// //   transactionLocationz: string;}


// import axios, { AxiosInstance } from 'axios';

// const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// export interface Transaction {
//   id: string;
//   userId: string;
//   amount: number;
//   currency: string;
//   location: string;
//   device: string;
//   timestamp: string;
//   riskScore: number;
//   status: 'approved' | 'declined' | 'pending';
//   fraudPrediction: boolean;
//   flags: string[];
// }

// export interface User {
//   id: string;
//   email: string;
//   name: string;
//   accountType: string;
//   location: string;
//   registrationDate: string;
//   riskLevel: 'low' | 'medium' | 'high';
//   transactionCount: number;
//   averageAmount: number;
// }

// export interface Alert {
//   id: string;
//   type: 'fraud' | 'security' | 'system';
//   severity: 'low' | 'medium' | 'high' | 'critical';
//   message: string;
//   timestamp: string;
//   userId?: string;
//   transactionId?: string;
//   status: 'new' | 'investigating' | 'resolved';
// }

// export interface DashboardData {
//   totalTransactions: number;
//   fraudDetected: number;
//   falsePositives: number;
//   accuracy: number;
//   recentTransactions: Transaction[];
//   alerts: Alert[];
//   riskDistribution: { level: string; count: number }[];
// }

// export interface MLFeatures {
//   amount: number;
//   hourOfDay: number;
//   dayOfWeek: number;
//   merchantRiskScore: number;
//   accountAge: number;
//   transactionCount1h: number;
//   transactionCount24h: number;
//   avgTransactionAmount: number;
//   locationRiskScore: number;
//   deviceRiskScore: number;
//   timeSinceLastTransaction: number;
//   paymentMethod: string;
//   ipReputationScore: number;
//   behavioralAnomalyScore: number;
//   crossBorderTransaction: boolean;
// }

// class ApiService {
//   private client: AxiosInstance;

//   constructor() {
//     this.client = axios.create({
//       baseURL: API_BASE_URL,
//       timeout: 10000,
//       headers: {
//         'Content-Type': 'application/json',
//       },
//     });

//     this.client.interceptors.request.use(
//       (config) => {
//         console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
//         return config;
//       },
//       (error) => {
//         console.error('API Request Error:', error);
//         return Promise.reject(error);
//       }
//     );

//     this.client.interceptors.response.use(
//       (response) => {
//         console.log(`API Response: ${response.status}`);
//         return response;
//       },
//       (error) => {
//         console.error('API Response Error:', error.response?.status, error.message);
//         return Promise.reject(error);
//       }
//     );
//   }

//   private async request<T>(endpoint: string, options: any = {}): Promise<T> {
//     try {
//       const response = await this.client.request({
//         url: endpoint,
//         ...options,
//       });
//       return response.data;
//     } catch (error: any) {
//       console.error(`API request failed: ${endpoint}`, error);
//       throw error;
//     }
//   }

//   async getDashboardData(): Promise<DashboardData> {
//     return this.request<DashboardData>('/dashboard');
//   }

//   async getTransactions(page = 1, limit = 10) {
//     return this.request<{ transactions: Transaction[]; total: number }>(
//       `/transactions?page=${page}&limit=${limit}`
//     );
//   }

//   async getTransaction(id: string) {
//     return this.request<Transaction>(`/transactions/${id}`);
//   }

//   async analyzeTransaction(transactionData: Partial<Transaction>) {
//     return this.request<{ riskScore: number; fraudPrediction: boolean; flags: string[] }>(
//       '/fraud/analyze',
//       {
//         method: 'POST',
//         data: transactionData,
//       }
//     );
//   }

//   async analyzeFraudRisk(features: MLFeatures) {
//     return this.request<{
//       riskScore: number;
//       fraudPrediction: boolean;
//       confidence: number;
//       explanation: {
//         riskFactors: string[];
//         featureImportance: Record<string, number>;
//       };
//     }>('/fraud/analyze', {
//       method: 'POST',
//       data: { features },
//     });
//   }

//   async getUsers(page = 1, limit = 10) {
//     return this.request<{ users: User[]; total: number }>(`/users?page=${page}&limit=${limit}`);
//   }

//   async getUser(id: string) {
//     return this.request<User>(`/users/${id}`);
//   }

//   async getUserRiskProfile(id: string) {
//     return this.request<{ riskLevel: string; factors: string[]; recommendations: string[] }>(
//       `/risk/user/${id}`
//     );
//   }

//   async getAlerts(page = 1, limit = 10) {
//     return this.request<{ alerts: Alert[]; total: number }>(`/alerts?page=${page}&limit=${limit}`);
//   }

//   async updateAlertStatus(id: string, status: Alert['status']) {
//     return this.request<Alert>(`/alerts/${id}`, {
//       method: 'PATCH',
//       data: { status },
//     });
//   }

//   async getSystemHealth() {
//     return this.request<{ 
//       status: string; 
//       uptime: number; 
//       performance: object;
//       mlService?: {
//         status: string;
//         isHealthy: boolean;
//         modelVersion: string;
//       };
//     }>('/admin/health');
//   }

//   async updateSettings(settings: object) {
//     return this.request<{ success: boolean }>('/admin/settings', {
//       method: 'PUT',
//       data: settings,
//     });
//   }

//   async trainMLModel() {
//     return this.request<{ 
//       status: string; 
//       message: string;
//       metrics?: {
//         accuracy: number;
//         precision: number;
//         recall: number;
//       };
//     }>('/admin/ml/train', {
//       method: 'POST',
//     });
//   }

//   async getMLModelStatus() {
//     return this.request<{
//       modelLoaded: boolean;
//       modelVersion: string;
//       lastTraining: string | null;
//       performanceMetrics: object;
//     }>('/admin/ml/status');
//   }

//   async testConnection() {
//     try {
//       const response = await this.client.get('/health');
//       return { success: true, status: response.status, data: response.data };
//     } catch (error: any) {
//       return { 
//         success: false, 
//         error: error.message, 
//         status: error.response?.status || 0 
//       };
//     }
//   }
// }

// export const api = axios.create({
//   baseURL: API_BASE_URL,
// });

// export const apiService = new ApiService();


// // C:\Users\aanus\Downloads\AutheTrack\AutheTrack\client\src\services\api.ts
// import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

// const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// export interface Transaction {
//   id: string;
//   userId: string;
//   amount: number;
//   currency: string;
//   location: string;
//   device: string;
//   timestamp: string;
//   riskScore: number;
//   status: 'approved' | 'declined' | 'pending';
//   fraudPrediction: boolean;
//   flags: string[];
// }

// export interface User {
//   id: string;
//   email: string;
//   name: string;
//   accountType: string;
//   location: string;
//   registrationDate: string;
//   riskLevel: 'low' | 'medium' | 'high';
//   transactionCount: number;
//   averageAmount: number;
// }

// export interface Alert {
//   id: string;
//   type: 'fraud' | 'security' | 'system';
//   severity: 'low' | 'medium' | 'high' | 'critical';
//   message: string;
//   timestamp: string;
//   userId?: string;
//   transactionId?: string;
//   status: 'new' | 'investigating' | 'resolved';
// }

// export interface DashboardData {
//   totalTransactions: number;
//   fraudDetected: number;
//   falsePositives: number;
//   accuracy: number;
//   recentTransactions: Transaction[];
//   alerts: Alert[];
//   riskDistribution: { level: string; count: number }[];
// }

// export interface MLFeatures {
//   amount: number;
//   hourOfDay: number;
//   dayOfWeek: number;
//   merchantRiskScore: number;
//   accountAge: number;
//   transactionCount1h: number;
//   transactionCount24h: number;
//   avgTransactionAmount: number;
//   locationRiskScore: number;
//   deviceRiskScore: number;
//   timeSinceLastTransaction: number;
//   paymentMethod: string;
//   ipReputationScore: number;
//   behavioralAnomalyScore: number;
//   crossBorderTransaction: boolean;
// }

// class ApiService {
//   private client: AxiosInstance;

//   constructor() {
//     this.client = axios.create({
//       baseURL: API_BASE_URL,
//       timeout: 10000,
//       headers: { 'Content-Type': 'application/json' },
//     });

//     this.client.interceptors.request.use(
//       (config) => {
//         console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
//         return config;
//       },
//       (error) => {
//         console.error('API Request Error:', error);
//         return Promise.reject(error);
//       }
//     );

//     this.client.interceptors.response.use(
//       (response) => {
//         console.log(`API Response: ${response.status}`);
//         return response;
//       },
//       (error) => {
//         console.error('API Response Error:', error.response?.status, error.message);
//         return Promise.reject(error);
//       }
//     );
//   }

//   private async request<T>(endpoint: string, options: AxiosRequestConfig = {}): Promise<T> {
//     try {
//       const response = await this.client.request({
//         url: endpoint,
//         ...options,
//       });
//       return response.data;
//     } catch (error: unknown) {
//       if (axios.isAxiosError(error)) {
//         console.error(`API request failed: ${endpoint}`, error.response?.status, error.message);
//       } else {
//         console.error(`API request failed: ${endpoint}`, error);
//       }
//       throw error;
//     }
//   }

//   async getDashboardData(): Promise<DashboardData> {
//     return this.request<DashboardData>('/dashboard');
//   }

//   async getTransactions(page = 1, limit = 10) {
//     return this.request<{ transactions: Transaction[]; total: number }>(
//       `/transactions?page=${page}&limit=${limit}`
//     );
//   }

//   async getTransaction(id: string) {
//     return this.request<Transaction>(`/transactions/${id}`);
//   }

//   async analyzeTransaction(transactionData: Partial<Transaction>) {
//     return this.request<{ riskScore: number; fraudPrediction: boolean; flags: string[] }>(
//       '/fraud/analyze',
//       { method: 'POST', data: transactionData }
//     );
//   }

//   async analyzeFraudRisk(features: MLFeatures) {
//     return this.request<{
//       riskScore: number;
//       fraudPrediction: boolean;
//       confidence: number;
//       explanation: { riskFactors: string[]; featureImportance: Record<string, number> };
//     }>('/fraud/analyze', { method: 'POST', data: { features } });
//   }

//   async getUsers(page = 1, limit = 10) {
//     return this.request<{ users: User[]; total: number }>(`/users?page=${page}&limit=${limit}`);
//   }

//   async getUser(id: string) {
//     return this.request<User>(`/users/${id}`);
//   }

//   async getUserRiskProfile(id: string) {
//     return this.request<{ riskLevel: string; factors: string[]; recommendations: string[] }>(
//       `/risk/user/${id}`
//     );
//   }

//   async getAlerts(page = 1, limit = 10) {
//     return this.request<{ alerts: Alert[]; total: number }>(`/alerts?page=${page}&limit=${limit}`);
//   }

//   async updateAlertStatus(id: string, status: Alert['status']) {
//     return this.request<Alert>(`/alerts/${id}`, { method: 'PATCH', data: { status } });
//   }

//   async getSystemHealth() {
//     return this.request<{
//       status: string;
//       uptime: number;
//       performance: object;
//       mlService?: { status: string; isHealthy: boolean; modelVersion: string };
//     }>('/admin/health');
//   }

//   async updateSettings(settings: object) {
//     return this.request<{ success: boolean }>('/admin/settings', {
//       method: 'PUT',
//       data: settings,
//     });
//   }

//   async trainMLModel() {
//     return this.request<{
//       status: string;
//       message: string;
//       metrics?: { accuracy: number; precision: number; recall: number };
//     }>('/admin/ml/train', { method: 'POST' });
//   }

//   async getMLModelStatus() {
//     return this.request<{
//       modelLoaded: boolean;
//       modelVersion: string;
//       lastTraining: string | null;
//       performanceMetrics: object;
//     }>('/admin/ml/status');
//   }

//   async testConnection() {
//     try {
//       const response = await this.client.get('/health');
//       return { success: true, status: response.status, data: response.data };
//     } catch (error: unknown) {
//       if (axios.isAxiosError(error)) {
//         return { success: false, error: error.message, status: error.response?.status || 0 };
//       }
//       return { success: false, error: 'Unknown error', status: 0 };
//     }
//   }
// }

// export const api = axios.create({ baseURL: API_BASE_URL });
// export const apiService = new ApiService();
// export default apiService;
// C:\Users\aanus\Downloads\AutheTrack\AutheTrack\client\src\services\api.ts
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

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

    this.client.interceptors.request.use(
      (config) => {
        console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('API Request Error:', error);
        return Promise.reject(error);
      }
    );

    this.client.interceptors.response.use(
      (response) => {
        console.log(`API Response: ${response.status}`);
        return response;
      },
      (error) => {
        console.error('API Response Error:', error.response?.status, error.message);
        return Promise.reject(error);
      }
    );
  }

  private async request<T>(endpoint: string, options: AxiosRequestConfig = {}): Promise<T> {
    try {
      const response = await this.client.request({
        url: endpoint,
        ...options,
      });
      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        console.error(`API request failed: ${endpoint}`, error.response?.status, error.message);
      } else {
        console.error(`API request failed: ${endpoint}`, error);
      }
      throw error;
    }
  }

  // Fixed dashboard endpoint to match backend route structure
  async getDashboardData(): Promise<DashboardData> {
    return this.request<DashboardData>('/transactions/dashboard');
  }

  // Fixed transactions endpoint to match backend route structure
  async getTransactions(page = 1, limit = 10) {
    return this.request<{ transactions: Transaction[]; total: number }>(
      `/transactions?page=${page}&limit=${limit}`
    );
  }

  async getTransaction(id: string) {
    return this.request<Transaction>(`/transactions/${id}`);
  }

  // Fixed to match fraud routes structure
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

  // Fixed users endpoint - likely needs to go through auth routes
  async getUsers(page = 1, limit = 10) {
    return this.request<{ users: User[]; total: number }>(`/auth/users?page=${page}&limit=${limit}`);
  }

  async getUser(id: string) {
    return this.request<User>(`/auth/users/${id}`);
  }

  async getUserRiskProfile(id: string) {
    return this.request<{ riskLevel: string; factors: string[]; recommendations: string[] }>(
      `/risk/user/${id}`
    );
  }

  // Fixed alerts - these likely go through fraud routes
  async getAlerts(page = 1, limit = 10) {
    return this.request<{ alerts: Alert[]; total: number }>(`/fraud/alerts?page=${page}&limit=${limit}`);
  }

  async updateAlertStatus(id: string, status: Alert['status']) {
    return this.request<Alert>(`/fraud/alerts/${id}`, { method: 'PATCH', data: { status } });
  }

  // Fixed admin endpoints to match adminRoutes structure
  async getSystemHealth() {
    return this.request<{
      status: string;
      uptime: number;
      performance: object;
      mlService?: { status: string; isHealthy: boolean; modelVersion: string };
    }>('/admin/health');
  }

  async updateSettings(settings: object) {
    return this.request<{ success: boolean }>('/admin/settings', {
      method: 'PUT',
      data: settings,
    });
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

  // Health check endpoint
  async testConnection() {
    try {
      const response = await this.client.get('/admin/health');
      return { success: true, status: response.status, data: response.data };
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        return { success: false, error: error.message, status: error.response?.status || 0 };
      }
      return { success: false, error: 'Unknown error', status: 0 };
    }
  }

  // Additional authentication methods that might be needed
  async login(email: string, password: string) {
    return this.request<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      data: { email, password }
    });
  }

  async register(userData: { email: string; password: string; name: string }) {
    return this.request<{ token: string; user: User }>('/auth/register', {
      method: 'POST',
      data: userData
    });
  }

  async logout() {
    return this.request<{ success: boolean }>('/auth/logout', { method: 'POST' });
  }

  // Risk assessment methods
  async getUserRiskData(userId: string) {
    return this.request<{ riskLevel: string; factors: string[]; recommendations: string[] }>(
      `/risk/user/${userId}`
    );
  }

  async updateRiskProfile(userId: string, profileData: object) {
    return this.request<{ success: boolean }>(`/risk/user/${userId}`, {
      method: 'PUT',
      data: profileData
    });
  }

  // Integration endpoints
  async verifyPayPalTransaction(transactionId: string) {
    return this.request<{ verified: boolean; details: object }>(`/integrations/paypal/verify`, {
      method: 'POST',
      data: { transactionId }
    });
  }

  async getDeviceFingerprint(fingerprintHash: string) {
    return this.request<{ deviceInfo: object; riskScore: number }>(`/integrations/device/${fingerprintHash}`);
  }

  async analyzeGeolocation(ipAddress: string) {
    return this.request<{ location: object; riskScore: number }>(`/integrations/geolocation/analyze`, {
      method: 'POST',
      data: { ipAddress }
    });
  }
}

export const api = axios.create({ baseURL: API_BASE_URL });
export const apiService = new ApiService();
export default apiService;