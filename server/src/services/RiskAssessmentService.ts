// server/src/services/RiskAssessmentService.ts
import { db } from '../config/firebase';
import { RiskProfile, Transaction, SpendingBaseline } from '../types';
import { AppError } from '../utils/AppError';
import { logger } from '../utils/logger';

export class RiskAssessmentService {
  async getRiskProfile(userId: string): Promise<RiskProfile> {
    try {
      const profileDoc = await db.collection('riskProfiles').doc(`${userId}_risk`).get();

      if (!profileDoc.exists) {
        throw new AppError('Risk profile not found', 404);
      }

      return profileDoc.data() as RiskProfile;
    } catch (error: any) {
      throw new AppError(error.message || 'Failed to retrieve risk profile', 500);
    }
  }

  async updateRiskProfile(userId: string, updates: Partial<RiskProfile>): Promise<RiskProfile> {
    try {
      const profileRef = db.collection('riskProfiles').doc(`${userId}_risk`);

      await profileRef.update({
        ...updates,
        lastUpdated: new Date()
      });

      const updatedProfile = await profileRef.get();
      return updatedProfile.data() as RiskProfile;
    } catch (error: any) {
      throw new AppError(error.message || 'Failed to update risk profile', 500);
    }
  }

  async calculateRealTimeRiskScore(userId: string, transactionData: any): Promise<number> {
    try {
      const riskProfile = await this.getRiskProfile(userId);
      const recentActivity = await this.getRecentUserActivity(userId);

      let riskScore = riskProfile.currentRiskScore;

      riskScore += this.assessTransactionRisk(transactionData, riskProfile);
      riskScore += this.assessVelocityRisk(recentActivity);
      riskScore += this.assessBehaviorRisk(transactionData, riskProfile.behaviorBaseline);

      return Math.min(Math.max(riskScore, 0), 1);
    } catch (error: any) {
      logger.error('Real-time risk calculation failed', { error: error.message, userId });
      return 0.5;
    }
  }

  async updateUserRiskLevel(userId: string): Promise<void> {
    try {
      const recentTransactions = await this.getRecentTransactions(userId, 30);
      const avgRiskScore = this.calculateAverageRiskScore(recentTransactions);

      let newRiskLevel: RiskProfile['riskLevel'] = 'low';
      if (avgRiskScore > 0.7) {
        newRiskLevel = 'high';
      } else if (avgRiskScore > 0.4) {
        newRiskLevel = 'medium';
      }

      await this.updateRiskProfile(userId, {
        currentRiskScore: avgRiskScore,
        riskLevel: newRiskLevel
      });

      await db.collection('users').doc(userId).update({
        riskLevel: newRiskLevel
      });

    } catch (error: any) {
      logger.error('Risk level update failed', { error: error.message, userId });
    }
  }

  private async getRecentUserActivity(userId: string) {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const snapshot = await db.collection('transactions')
      .where('userId', '==', userId)
      .where('timestamp', '>=', twentyFourHoursAgo)
      .orderBy('timestamp', 'desc')
      .get();

    return {
      transactions: snapshot.docs.map(doc => doc.data()),
      count: snapshot.size,
      totalAmount: snapshot.docs.reduce((sum, doc) => sum + parseFloat(doc.data().amount), 0)
    };
  }

  private async getRecentTransactions(userId: string, days: number): Promise<Transaction[]> {
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const snapshot = await db.collection('transactions')
      .where('userId', '==', userId)
      .where('timestamp', '>=', cutoffDate)
      .get();

    return snapshot.docs.map(doc => doc.data() as Transaction);
  }

  private assessTransactionRisk(transactionData: any, riskProfile: RiskProfile): number {
    let risk = 0;
    const amount = parseFloat(transactionData.amount);

    const avgAmount = (riskProfile.spendingBaseline as SpendingBaseline)?.avgAmount ?? 100;
    if (amount > avgAmount * 5) risk += 0.3;
    else if (amount > avgAmount * 2) risk += 0.1;

    if (transactionData.merchantCategory === 'high_risk') risk += 0.2;

    const hour = new Date().getHours();
    if (hour < 6 || hour > 22) risk += 0.1;

    return risk;
  }

  private assessVelocityRisk(recentActivity: { count: number; totalAmount: number }): number {
    let risk = 0;

    if (recentActivity.count > 20) risk += 0.3;
    else if (recentActivity.count > 10) risk += 0.1;

    if (recentActivity.totalAmount > 5000) risk += 0.2;
    else if (recentActivity.totalAmount > 2000) risk += 0.1;

    return risk;
  }

  private assessBehaviorRisk(transactionData: any, behaviorBaseline: any): number {
    let risk = 0;

    const preferredMerchants = behaviorBaseline?.preferredMerchants || [];
    if (!preferredMerchants.includes(transactionData.merchantId)) {
      risk += 0.1;
    }

    const typicalLocations = behaviorBaseline?.typicalLocations || [];
    if (transactionData.location && typicalLocations.length > 0) {
      const isTypicalLocation = typicalLocations.some((loc: any) =>
        this.calculateDistance(
          transactionData.location.latitude,
          transactionData.location.longitude,
          loc.latitude,
          loc.longitude
        ) < 10
      );
      if (!isTypicalLocation) risk += 0.15;
    }

    return risk;
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(this.deg2rad(lat1)) *
      Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  private calculateAverageRiskScore(transactions: Transaction[]): number {
    if (transactions.length === 0) return 0.1;

    const totalRisk = transactions.reduce((sum, t) => sum + (t.riskScore || 0), 0);
    return totalRisk / transactions.length;
  }
}
