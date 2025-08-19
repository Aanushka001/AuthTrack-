// ### server/src/services/FraudAnalysisService.ts (Neatly Corrected & Consolidated)

import { db } from '../config/database';
import { logger } from '../utils/logger';
import { MLService } from './MLService';
import { mlConfig } from '../config/mlService';

/** --- Types & Interfaces --- */

interface GeoPoint {
  latitude: number;
  longitude: number;
}

interface TransactionData {
  id: string;
  userId: string;
  amount: number | string;
  merchantId?: string;
  merchantCategory?: string;
  location?: GeoPoint | null;
  timestamp?: Date;
}

interface RiskProfile {
  id: string;
  currentRiskScore: number;
  behaviorBaseline: {
    avgTransactionAmount: number;
    transactionFrequency: number;
    preferredMerchants: string[];
    typicalLocations: Array<GeoPoint & { count?: number }>;
  };
  spendingBaseline: {
    avgAmount: number;
  };
  createdAt: Date;
}

interface FraudAlert {
  id: string;
  transactionId: string;
  userId: string;
  alertType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  riskScore: number;
  triggerRules: string[];
  status: 'open' | 'closed' | 'investigating';
  assignedTo: string;
  createdAt: Date;
  resolution: any;
  investigationNotes: string;
}

interface MLExplanation {
  riskFactors: string[];
  featureImportance: Record<string, number>;
}

interface MLAnalysis {
  riskScore: number; // 0..1
  prediction: 'fraud' | 'legitimate';
  confidence: number; // 0..1
  explanation: MLExplanation;
}

interface FeatureVector {
  amount: number;
  amountNormalized: number;
  hourOfDay: number;
  dayOfWeek: number;
  isWeekend: boolean;
  merchantCategory: string;
  merchantRiskScore: number; // 0..1
  deviceConsistency: number; // 0..1
  locationConsistency: number; // 0..1
  velocityScore: number; // 0..1
  transactionCount24h: number;
  amountSum24h: number;
  userRiskScore: number; // 0..1-ish
  accountAge: number; // years (capped at 5)
  previousFraudCount: number;
  isHighValueTransaction: boolean;
  isNewMerchant: boolean;
}

/** --- Service --- */

export class FraudAnalysisService {
  private mlService: MLService;

  constructor() {
    this.mlService = new MLService();
  }

  /**
   * Enhanced analyzeTransaction with ML explanation, rules, and logging
   */
  async analyzeTransaction(
    transactionData: TransactionData,
    userId: string,
    deviceFingerprint: string
  ): Promise<{
    riskScore: number;
    fraudPrediction: 'fraud' | 'legitimate';
    confidence: number;
    features: FeatureVector;
    explanation: MLExplanation;
    alerts: FraudAlert[];
  }> {
    try {
      logger.info('Starting fraud analysis', {
        transactionId: transactionData.id,
        userId,
        amount: transactionData.amount
      });

      // Get user profile and features
      const userProfile = await this.getUserRiskProfile(userId);
      const features = await this.extractFeatures(transactionData, userProfile, deviceFingerprint);

      // ML prediction with explanation
      const mlAnalysis: MLAnalysis = await this.mlService.analyzeFraudWithExplanation(features);

      // Combine ML + rules + user baseline
      const finalRiskScore = this.calculateEnhancedRiskScore(features, mlAnalysis.riskScore, userProfile);

      // Alerts
      const alerts = await this.generateAlerts(transactionData, finalRiskScore, features);

      // Baseline updates
      await this.updateUserBehaviorBaseline(userId, transactionData);

      logger.info('Fraud analysis completed', {
        transactionId: transactionData.id,
        riskScore: finalRiskScore,
        prediction: mlAnalysis.prediction,
        confidence: mlAnalysis.confidence,
        alertsGenerated: alerts.length,
        mlServiceUsed: mlConfig.getConfig().serviceUrl !== 'http://localhost:5001'
      });

      return {
        riskScore: finalRiskScore,
        fraudPrediction: finalRiskScore > 0.7 ? 'fraud' : 'legitimate',
        confidence: mlAnalysis.confidence,
        features,
        explanation: {
          riskFactors: mlAnalysis.explanation.riskFactors,
          featureImportance: mlAnalysis.explanation.featureImportance
        },
        alerts
      };
    } catch (error: any) {
      logger.error('Fraud analysis failed', {
        error: error?.message ?? String(error),
        transactionId: transactionData.id,
        userId
      });

      // Safe fallback
      return {
        riskScore: 0.5,
        fraudPrediction: 'legitimate',
        confidence: 0.1,
        features: {
          amount: typeof transactionData.amount === 'string' ? parseFloat(transactionData.amount) : (transactionData.amount ?? 0),
          amountNormalized: 1,
          hourOfDay: new Date().getHours(),
          dayOfWeek: new Date().getDay(),
          isWeekend: [0, 6].includes(new Date().getDay()),
          merchantCategory: transactionData.merchantCategory || 'unknown',
          merchantRiskScore: 0.5,
          deviceConsistency: 0.5,
          locationConsistency: 0.5,
          velocityScore: 0,
          transactionCount24h: 0,
          amountSum24h: 0,
          userRiskScore: 0.1,
          accountAge: 0,
          previousFraudCount: 0,
          isHighValueTransaction: false,
          isNewMerchant: true
        },
        explanation: {
          riskFactors: ['Analysis failed - using default assessment'],
          featureImportance: {}
        },
        alerts: []
      };
    }
  }

  /** Risk scoring: ML (60%) + rules (40%) + current profile (10%), then clamp 0..1 */
  private calculateEnhancedRiskScore(
    features: FeatureVector,
    mlPrediction: number,
    userProfile: RiskProfile
  ): number {
    let riskScore = mlPrediction * 0.6;
    const ruleBasedScore = this.calculateRuleBasedScore(features);
    riskScore += ruleBasedScore * 0.4;
    riskScore += (userProfile.currentRiskScore ?? 0) * 0.1;
    return Math.min(Math.max(riskScore, 0), 1);
  }

  /** Rule-based scoring system (removed unused userProfile param to fix TS6133) */
  private calculateRuleBasedScore(features: FeatureVector): number {
    let score = 0.1;

    // Velocity / burst activity
    if (features.velocityScore > 0.8) score += 0.3;
    else if (features.velocityScore > 0.5) score += 0.15;

    // Device and location anomalies
    if (features.deviceConsistency < 0.3) score += 0.2;
    if (features.locationConsistency < 0.2) score += 0.2;

    // Merchant + value signals
    if (features.isHighValueTransaction) score += 0.1;
    if (features.isNewMerchant && features.amount > 1000) score += 0.15;
    if (features.merchantRiskScore > 0.7) score += 0.1;

    // Odd hours
    if (features.hourOfDay < 6 || features.hourOfDay > 23) score += 0.05;
    if (!features.isWeekend && (features.hourOfDay < 9 || features.hourOfDay > 17)) score += 0.05;

    // History
    if (features.previousFraudCount > 0) score += 0.15;
    // Account age (in years). <0.1 ~ ~36 days
    if (features.accountAge < 0.1) score += 0.1;

    return Math.min(score, 1.0);
  }

  /** ML Service Health Check */
  public getMLServiceStatus(): {
    isHealthy: boolean;
    serviceUrl: string;
    modelName: string;
    lastHealthCheck: Date | null;
  } {
    return this.mlService.getStatus();
  }

  /** ---------------- Helpers ---------------- */

  private async getUserRiskProfile(userId: string): Promise<RiskProfile> {
    try {
      if (!db) throw new Error('Database not initialized');

      const docRef = db.collection('riskProfiles').doc(`${userId}_risk`);
      const profileDoc = await docRef.get();

      if (!profileDoc.exists) {
        const fresh: RiskProfile = {
          id: userId,
          currentRiskScore: 0.1,
          behaviorBaseline: {
            avgTransactionAmount: 100,
            transactionFrequency: 5,
            preferredMerchants: [],
            typicalLocations: []
          },
          spendingBaseline: { avgAmount: 100 },
          createdAt: new Date()
        };
        return fresh;
      }

      return profileDoc.data() as RiskProfile;
    } catch (error) {
      logger.error('Error getting user risk profile:', error);
      return {
        id: userId,
        currentRiskScore: 0.1,
        behaviorBaseline: {
          avgTransactionAmount: 100,
          transactionFrequency: 5,
          preferredMerchants: [],
          typicalLocations: []
        },
        spendingBaseline: { avgAmount: 100 },
        createdAt: new Date()
      };
    }
  }

  private async extractFeatures(
    transactionData: TransactionData,
    userProfile: RiskProfile,
    deviceFingerprint: string
  ): Promise<FeatureVector> {
    const now = new Date();
    const hourOfDay = now.getHours();
    const dayOfWeek = now.getDay();

    const recentTransactions = await this.getRecentTransactions(transactionData.userId, 24);
    const velocity = this.calculateVelocityFeatures(recentTransactions, transactionData.amount);

    const amountNum =
      typeof transactionData.amount === 'string'
        ? parseFloat(transactionData.amount)
        : (transactionData.amount ?? 0);

    return {
      amount: amountNum,
      amountNormalized: this.normalizeAmount(amountNum, userProfile.spendingBaseline),
      hourOfDay,
      dayOfWeek,
      isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
      merchantCategory: transactionData.merchantCategory || 'unknown',
      merchantRiskScore: await this.getMerchantRiskScore(transactionData.merchantId || ''),
      deviceConsistency: await this.calculateDeviceConsistency(transactionData.userId, deviceFingerprint),
      locationConsistency: await this.calculateLocationConsistency(transactionData.userId, transactionData.location),
      velocityScore: velocity.velocityScore,
      transactionCount24h: velocity.count24h,
      amountSum24h: velocity.sum24h,
      userRiskScore: userProfile.currentRiskScore,
      accountAge: this.calculateAccountAge(userProfile.createdAt),
      previousFraudCount: await this.getPreviousFraudCount(transactionData.userId),
      isHighValueTransaction: amountNum > (userProfile.spendingBaseline.avgAmount || 0) * 3,
      isNewMerchant: await this.isNewMerchant(transactionData.userId, transactionData.merchantId || '')
    };
  }

  private normalizeAmount(amount: number, baseline: RiskProfile['spendingBaseline']): number {
    const avg = baseline?.avgAmount ?? 0;
    if (!avg) return 1.0;
    return Math.min(amount / avg, 10.0);
  }

  private async getRecentTransactions(userId: string, hours: number) {
    try {
      if (!db) return [];
      const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
      const snapshot = await db
        .collection('transactions')
        .where('userId', '==', userId)
        .where('timestamp', '>=', cutoffTime)
        .orderBy('timestamp', 'desc')
        .get();

      return snapshot.docs.map((doc) => doc.data());
    } catch (error) {
      logger.error('Error getting recent transactions:', error);
      return [];
    }
  }

  private calculateVelocityFeatures(recentTransactions: any[], currentAmount: number | string) {
    const currentAmt = typeof currentAmount === 'string' ? parseFloat(currentAmount) : (currentAmount ?? 0);
    const count24h = recentTransactions.length;
    const sum24h = recentTransactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);

    let velocityScore = 0;
    if (count24h > 10) velocityScore += 0.3;
    if (count24h > 20) velocityScore += 0.3;
    if (sum24h > 5000) velocityScore += 0.2;
    if (currentAmt > 1000) velocityScore += 0.2;

    return { velocityScore: Math.min(velocityScore, 1), count24h, sum24h };
  }

  private async getMerchantRiskScore(merchantId: string): Promise<number> {
    try {
      if (!db || !merchantId) return 0.5;
      const merchantDoc = await db.collection('merchantProfiles').doc(merchantId).get();
      return merchantDoc.exists ? merchantDoc.data()?.riskScore ?? 0.5 : 0.5;
    } catch {
      return 0.5;
    }
  }

  private async calculateDeviceConsistency(userId: string, deviceFingerprint: string): Promise<number> {
    try {
      if (!db) return 0.5;
      const userDoc = await db.collection('users').doc(userId).get();
      const linkedDevices: string[] = (userDoc.data()?.linkedDevices ?? []) as string[];
      if (!deviceFingerprint) return 0.0;
      return linkedDevices.includes(deviceFingerprint) ? 1.0 : 0.0;
    } catch {
      return 0.5;
    }
  }

  private async calculateLocationConsistency(userId: string, location?: GeoPoint | null): Promise<number> {
    if (!location || typeof location.latitude !== 'number' || typeof location.longitude !== 'number') return 0.5;

    try {
      const recentTransactions = await this.getRecentTransactions(userId, 24 * 30);
      const locations: GeoPoint[] = recentTransactions
        .filter((t) => t.location && t.location.latitude && t.location.longitude)
        .map((t) => t.location);

      if (locations.length === 0) return 0.5;

      const distances = locations.map((loc) =>
        this.calculateDistance(location.latitude, location.longitude, loc.latitude, loc.longitude)
      );
      const avgDistanceKm = distances.reduce((sum, d) => sum + d, 0) / distances.length;

      // Map average distance to consistency: closer = more consistent.
      // 0 km -> 1.0; 100+ km -> ~0.0
      return Math.max(0, 1 - avgDistanceKm / 100);
    } catch {
      return 0.5;
    }
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  private deg2rad(deg: number): number {
    return (deg * Math.PI) / 180;
  }

  /** Returns account age in YEARS (capped at 5) */
  private calculateAccountAge(createdAt: any): number {
    const created = createdAt?.toDate ? createdAt.toDate() : new Date(createdAt);
    const ageInDays = (Date.now() - created.getTime()) / (1000 * 60 * 60 * 24);
    const years = ageInDays / 365;
    return Math.min(years, 5);
  }

  private async getPreviousFraudCount(userId: string): Promise<number> {
    try {
      if (!db) return 0;
      const snapshot = await db
        .collection('fraudAlerts')
        .where('userId', '==', userId)
        .where('status', '==', 'confirmed_fraud')
        .get();
      return snapshot.size;
    } catch {
      return 0;
    }
  }

  private async isNewMerchant(userId: string, merchantId: string): Promise<boolean> {
    try {
      if (!db || !merchantId) return true;
      const snapshot = await db
        .collection('transactions')
        .where('userId', '==', userId)
        .where('merchantId', '==', merchantId)
        .limit(1)
        .get();
      return snapshot.empty;
    } catch {
      return true;
    }
  }

  private async generateAlerts(
    transactionData: TransactionData,
    riskScore: number,
    features: FeatureVector
  ): Promise<FraudAlert[]> {
    const alerts: FraudAlert[] = [];

    const makeId = () => `alert_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;

    if (riskScore > 0.8) {
      alerts.push({
        id: makeId(),
        transactionId: transactionData.id,
        userId: transactionData.userId,
        alertType: 'high_risk_transaction',
        severity: 'critical',
        riskScore,
        triggerRules: this.identifyTriggerRules(features, riskScore),
        status: 'open',
        assignedTo: '',
        createdAt: new Date(),
        resolution: {},
        investigationNotes: ''
      });
    }

    if (features.velocityScore > 0.7) {
      alerts.push({
        id: makeId(),
        transactionId: transactionData.id,
        userId: transactionData.userId,
        alertType: 'velocity_anomaly',
        severity: 'high',
        riskScore,
        triggerRules: ['high_transaction_velocity'],
        status: 'open',
        assignedTo: '',
        createdAt: new Date(),
        resolution: {},
        investigationNotes: ''
      });
    }

    return alerts;
  }

  private identifyTriggerRules(features: FeatureVector, riskScore: number): string[] {
    const rules: string[] = [];

    if (riskScore > 0.8) rules.push('high_risk_score');
    if (features.velocityScore > 0.5) rules.push('transaction_velocity');
    if (features.deviceConsistency < 0.5) rules.push('unknown_device');
    if (features.locationConsistency < 0.3) rules.push('unusual_location');
    if (features.isHighValueTransaction) rules.push('high_value_transaction');
    if (features.isNewMerchant && features.amount > 500) rules.push('new_merchant_high_amount');

    return rules;
  }

  /** Update behavior baseline after a transaction */
  private async updateUserBehaviorBaseline(userId: string, transactionData: TransactionData): Promise<void> {
    try {
      if (!db) return;

      const profileRef = db.collection('riskProfiles').doc(`${userId}_risk`);
      const profileSnap = await profileRef.get();

      const amountNum =
        typeof transactionData.amount === 'string'
          ? parseFloat(transactionData.amount)
          : (transactionData.amount ?? 0);

      if (!profileSnap.exists) {
        await profileRef.set({
          currentRiskScore: 0.1,
          behaviorBaseline: {
            avgTransactionAmount: amountNum,
            transactionFrequency: 1,
            preferredMerchants: transactionData.merchantId ? [transactionData.merchantId] : [],
            typicalLocations: transactionData.location ? [transactionData.location] : []
          },
          spendingBaseline: {
            avgAmount: amountNum
          },
          createdAt: new Date(),
          lastUpdated: new Date()
        });
        return;
      }

      const profile = profileSnap.data() as RiskProfile;

      const updatedBaseline = {
        avgTransactionAmount: this.updateMovingAverage(
          profile.behaviorBaseline?.avgTransactionAmount ?? 0,
          amountNum,
          0.1
        ),
        transactionFrequency: (profile.behaviorBaseline?.transactionFrequency ?? 0) + 1,
        preferredMerchants: this.updatePreferredMerchants(
          profile.behaviorBaseline?.preferredMerchants ?? [],
          transactionData.merchantId || ''
        ),
        typicalLocations: this.updateTypicalLocations(
          profile.behaviorBaseline?.typicalLocations ?? [],
          transactionData.location || null
        )
      };

      const updatedSpending = {
        avgAmount: this.updateMovingAverage(profile.spendingBaseline?.avgAmount ?? 0, amountNum, 0.1)
      };

      await profileRef.update({
        behaviorBaseline: updatedBaseline,
        spendingBaseline: updatedSpending,
        lastUpdated: new Date()
      });
    } catch (error) {
      logger.error('Error updating user behavior baseline:', error);
    }
  }

  private updateMovingAverage(current: number, newValue: number, alpha: number): number {
    if (!current) return newValue;
    return (1 - alpha) * current + alpha * newValue;
  }

  private updatePreferredMerchants(current: string[], merchantId: string): string[] {
    if (!merchantId) return current;
    const updated = current.includes(merchantId) ? current : [...current, merchantId];
    // Keep only the last 10
    return updated.slice(-10);
  }

  private updateTypicalLocations(
    current: Array<GeoPoint & { count?: number }>,
    location: GeoPoint | null
  ): Array<GeoPoint & { count?: number }> {
    if (!location || typeof location.latitude !== 'number' || typeof location.longitude !== 'number') return current;

    const updated = [...current];
    const idx = updated.findIndex(
      (loc) => this.calculateDistance(loc.latitude, loc.longitude, location.latitude, location.longitude) < 1 // within 1km
    );

    if (idx === -1) {
      updated.push({ latitude: location.latitude, longitude: location.longitude, count: 1 });
      return updated.slice(-20);
    }

    updated[idx].count = (updated[idx].count ?? 0) + 1;
    return updated;
  }
}
