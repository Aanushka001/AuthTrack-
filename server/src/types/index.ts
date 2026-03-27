/* =========================
   CORE USER DOMAIN
========================= */

export interface User {
  id: string;
  email: string;

  firstName: string;
  lastName: string;
  role: 'user' | 'admin';

  createdAt: Date;
  lastLoginAt: Date;

  isActive: boolean;
  riskLevel: 'low' | 'medium' | 'high';

  behaviorBaseline: BehaviorBaseline;
  linkedDevices: string[];
  complianceStatus: 'compliant' | 'non-compliant';
}


/* =========================
   TRANSACTIONS & FRAUD
========================= */

export interface Transaction {
  id: string;
  userId: string;
  transactionId: string;

  amount: number;
  currency: string;
  merchantId: string;

  timestamp: Date | FirebaseFirestore.Timestamp;

  riskScore: number;
  fraudPrediction: 'fraud' | 'legitimate';
  confidence: number;

  status: 'approved' | 'declined' | 'investigating';

  deviceFingerprint: string;
  ipAddress: string;
  location: GeoPoint;

  features: MLFeatures;
  auditTrail: AuditEntry[];
}


/* =========================
   RISK & ANALYTICS
========================= */

export interface RiskProfile {
  id: string;
  userId: string;

  currentRiskScore: number;
  riskLevel: 'low' | 'medium' | 'high';

  behaviorBaseline: BehaviorBaseline;
  anomalyThresholds: AnomalyThresholds;

  lastUpdated: Date;

  transactionVelocity: VelocityMetrics;
  deviceConsistency: number;

  geographicPatterns: GeographicPattern[];
  spendingBaseline: SpendingBaseline;

  alertSettings: AlertSettings;
}


/* =========================
   DEVICE TRACKING
========================= */

export interface DeviceFingerprint {
  id: string;
  fingerprintHash: string;
  userId: string;

  browserInfo: BrowserInfo;
  deviceInfo: DeviceInfo;
  screenInfo: ScreenInfo;
  timezoneInfo: TimezoneInfo;

  firstSeen: Date;
  lastSeen: Date;

  isActive: boolean;
  riskScore: number;

  sharedUsers: string[];
}


/* =========================
   ALERTS
========================= */

export interface FraudAlert {
  id: string;
  transactionId: string;
  userId: string;

  alertType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';

  riskScore: number;
  triggerRules: string[];

  status: 'open' | 'investigating' | 'resolved' | 'false_positive';

  assignedTo?: string;

  createdAt: Date;
  resolvedAt?: Date;

  resolution?: AlertResolution;
  investigationNotes: string;
}


/* =========================
   BEHAVIOR BASELINE
========================= */

export interface BehaviorBaseline {
  typingSpeed: number;
  mousePressure: number;
  sessionDuration: number;
  transactionFrequency: number;

  preferredMerchants: string[];
  typicalLocations: string[];

  keyboardLayout?: string;
  mouseMovement?: number;
  preferredTimes?: number[];
  deviceSwitchingPattern?: number;
}


/* =========================
   MACHINE LEARNING FEATURES
========================= */

export interface MLFeatures {
  transactionAmount: number;
  timeOfDay: number;
  dayOfWeek: number;

  merchantRisk: number;
  locationRisk: number;
  deviceRisk: number;

  velocityScore: number;
  patternScore: number;
  behaviorScore: number;

  networkRisk: number;
  sessionAnomalyScore: number;

  accountAge: number;
  historicalRisk: number;
  crossReferenceScore: number;
  biometricScore: number;
}


/* =========================
   SUPPORTING STRUCTURES
========================= */

export interface AuditEntry {
  timestamp: Date;
  action: string;
  userId?: string;
  details: Record<string, unknown>;
}

export interface GeoPoint {
  latitude: number;
  longitude: number;
}

export interface AnomalyThresholds {
  transaction: number;
  location: number;
  device: number;
  behavior: number;
  velocity: number;
}

export interface VelocityMetrics {
  transactionsPerHour: number;
  transactionsPerDay: number;
  averageAmount: number;
  maxAmount: number;
  uniqueMerchants: number;
}

export interface GeographicPattern {
  country: string;
  region: string;
  frequency: number;
  riskScore: number;
}

export interface SpendingBaseline {
  dailyAverage: number;
  weeklyAverage: number;
  monthlyAverage: number;

  avgAmount: number;
  transactionCount: number;

  categoryBreakdown: Record<string, number>;
  seasonalPatterns: Record<string, number>;
}

export interface AlertSettings {
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;

  thresholds: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
}


/* =========================
   DEVICE DETAILS
========================= */

export interface BrowserInfo {
  userAgent: string;
  language: string;
  platform: string;

  cookieEnabled: boolean;
  doNotTrack: boolean;

  plugins: string[];
}

export interface DeviceInfo {
  type: 'desktop' | 'mobile' | 'tablet';
  os: string;
  browser: string;
  version: string;

  mobile: boolean;
  touchSupport: boolean;
}

export interface ScreenInfo {
  width: number;
  height: number;
  colorDepth: number;
  pixelRatio: number;
  orientation: string;
}

export interface TimezoneInfo {
  timezone: string;
  offset: number;
  dst: boolean;
}


/* =========================
   ALERT RESOLUTION
========================= */

export interface AlertResolution {
  outcome: 'confirmed_fraud' | 'false_positive' | 'inconclusive';
  confidence: number;
  reasoning: string;
  actionsTaken: string[];
}
export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  data: T[];

  total: number;
  page: number;
  limit: number;

  hasNext: boolean;
  hasPrevious: boolean;
}
export interface WebSocketMessage {
  type: 'fraud_alert' | 'transaction_update' | 'system_status';
  payload: unknown;
  timestamp: string;
}