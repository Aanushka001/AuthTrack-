// server/src/controllers/riskController.ts
import { Request, Response, NextFunction } from 'express';
import { RiskAssessmentService } from '../services/RiskAssessmentService';
import { sendSuccess, sendError } from '../utils/response';
import { logger } from '../utils/logger';

// Define missing type so TS stops complaining
interface BehaviorBaseline {
  avgTransactionAmount?: number;
  transactionFrequency?: number;
  preferredMerchants?: string[];
  typicalLocations?: string[];
}

interface RiskProfile {
  currentRiskScore: number;
  riskLevel: string;
  deviceConsistency: number;
  lastUpdated: Date | string;
  behaviorBaseline?: BehaviorBaseline;
  alertSettings?: any;
}

interface AuthRequest extends Request {
  user?: {
    uid: string;
    email: string;
  };
}

export class RiskController {
  private riskAssessmentService: RiskAssessmentService;

  constructor() {
    this.riskAssessmentService = new RiskAssessmentService();
  }

  getRiskProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return sendError(res, 'Authentication required', 401);
      }

      const riskProfile = await this.riskAssessmentService.getRiskProfile(req.user.uid);
      sendSuccess(res, riskProfile);
    } catch (error) {
      next(error);
    }
  };

  updateRiskProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return sendError(res, 'Authentication required', 401);
      }

      const { anomalyThresholds, alertSettings } = req.body;
      const allowedUpdates = { anomalyThresholds, alertSettings };

      const updatedProfile = await this.riskAssessmentService.updateRiskProfile(
        req.user.uid,
        allowedUpdates
      );

      logger.info('Risk profile updated', { userId: req.user.uid });
      sendSuccess(res, updatedProfile, 'Risk profile updated successfully');
    } catch (error) {
      next(error);
    }
  };

  getRealTimeRiskScore = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return sendError(res, 'Authentication required', 401);
      }

      const transactionData = req.body;
      const riskScore = await this.riskAssessmentService.calculateRealTimeRiskScore(
        req.user.uid,
        transactionData
      );

      sendSuccess(res, {
        riskScore,
        riskLevel: riskScore > 0.7 ? 'high' : riskScore > 0.4 ? 'medium' : 'low',
        timestamp: new Date()
      });
    } catch (error) {
      next(error);
    }
  };

  getDashboardMetrics = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return sendError(res, 'Authentication required', 401);
      }

      const riskProfile: RiskProfile = await this.riskAssessmentService.getRiskProfile(req.user.uid);

      const metrics = {
        currentRiskScore: riskProfile.currentRiskScore,
        riskLevel: riskProfile.riskLevel,
        deviceConsistency: riskProfile.deviceConsistency,
        lastUpdated: riskProfile.lastUpdated,
        behaviorBaseline: {
          avgTransactionAmount: riskProfile.behaviorBaseline?.avgTransactionAmount ?? 0,
          transactionFrequency: riskProfile.behaviorBaseline?.transactionFrequency ?? 0,
          preferredMerchantsCount: riskProfile.behaviorBaseline?.preferredMerchants?.length ?? 0,
          typicalLocationsCount: riskProfile.behaviorBaseline?.typicalLocations?.length ?? 0
        },
        alertSettings: riskProfile.alertSettings
      };

      sendSuccess(res, metrics);
    } catch (error) {
      next(error);
    }
  };
}
