
// ### server/src/services/AuthService.ts
import { auth, db } from '../config/firebase';
import { AppError } from '../utils/AppError';
import { User, CreateUserRequest } from '../types';
import { generateDeviceFingerprint } from '../utils/deviceFingerprint';
import { Request } from 'express';

export class AuthService {
  async createUser(userData: CreateUserRequest, req: Request): Promise<User> {
    try {
      const userRecord = await auth.createUser({
        email: userData.email,
        password: userData.password,
        displayName: `${userData.firstName} ${userData.lastName}`
      });

      const deviceFingerprint = generateDeviceFingerprint(req);
      
      const user: User = {
        id: userRecord.uid,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: 'user',
        isActive: true,
        riskLevel: 'low',
        createdAt: new Date(),
        lastLoginAt: new Date(),
        behaviorBaseline: {},
        linkedDevices: [deviceFingerprint],
        complianceStatus: 'compliant'
      };

      await db.collection('users').doc(userRecord.uid).set(user);
      
      await this.createInitialRiskProfile(userRecord.uid);
      
      return user;
    } catch (error: any) {
      throw new AppError(error.message || 'User creation failed', 400);
    }
  }

  async getUserById(userId: string): Promise<User | null> {
    try {
      const userDoc = await db.collection('users').doc(userId).get();
      return userDoc.exists ? userDoc.data() as User : null;
    } catch (error: any) {
      throw new AppError(error.message || 'User retrieval failed', 500);
    }
  }

  async updateUserProfile(userId: string, updates: Partial<User>): Promise<User> {
    try {
      const userRef = db.collection('users').doc(userId);
      await userRef.update({
        ...updates,
        updatedAt: new Date()
      });

      const updatedUser = await userRef.get();
      return updatedUser.data() as User;
    } catch (error: any) {
      throw new AppError(error.message || 'Profile update failed', 500);
    }
  }

  async updateLastLogin(userId: string, deviceFingerprint: string): Promise<void> {
    try {
      const userRef = db.collection('users').doc(userId);
      const user = await userRef.get();
      const userData = user.data() as User;

      const linkedDevices = userData.linkedDevices || [];
      if (!linkedDevices.includes(deviceFingerprint)) {
        linkedDevices.push(deviceFingerprint);
      }

      await userRef.update({
        lastLoginAt: new Date(),
        linkedDevices
      });
    } catch (error: any) {
      throw new AppError(error.message || 'Login update failed', 500);
    }
  }

  private async createInitialRiskProfile(userId: string): Promise<void> {
    const riskProfile = {
      id: `${userId}_risk`,
      userId,
      currentRiskScore: 0.1,
      riskLevel: 'low',
      behaviorBaseline: {
        avgTransactionAmount: 0,
        transactionFrequency: 0,
        preferredMerchants: [],
        typicalLocations: []
      },
      anomalyThresholds: {
        amountDeviation: 2.0,
        frequencyDeviation: 1.5,
        locationDeviation: 100
      },
      lastUpdated: new Date(),
      transactionVelocity: {
        hourly: 0,
        daily: 0,
        weekly: 0
      },
      deviceConsistency: 1.0,
      geographicPatterns: {},
      spendingBaseline: {
        avgAmount: 0,
        maxAmount: 0,
        categoryDistribution: {}
      },
      alertSettings: {
        highRiskThreshold: 0.8,
        emailAlerts: true,
        smsAlerts: false
      }
    };

    await db.collection('riskProfiles').doc(`${userId}_risk`).set(riskProfile);
  }
}
