
// ### server/src/utils/deviceFingerprint.ts
import crypto from 'crypto';
import { Request } from 'express';

export interface DeviceInfo {
  userAgent: string;
  acceptLanguage: string;
  acceptEncoding: string;
  ipAddress: string;
  xForwardedFor?: string;
  screenResolution?: string;
  timezone?: string;
  browserFingerprint?: string;
}

export const generateDeviceFingerprint = (req: Request, additionalData?: any): string => {
  const deviceInfo: DeviceInfo = {
    userAgent: req.headers['user-agent'] || '',
    acceptLanguage: req.headers['accept-language'] || '',
    acceptEncoding: req.headers['accept-encoding'] || '',
    ipAddress: req.ip || '',
    xForwardedFor: req.headers['x-forwarded-for'] as string,
    ...additionalData
  };

  const fingerprintString = JSON.stringify(deviceInfo);
  return crypto.createHash('sha256').update(fingerprintString).digest('hex');
};

export const extractDeviceInfo = (req: Request): DeviceInfo => {
  return {
    userAgent: req.headers['user-agent'] || '',
    acceptLanguage: req.headers['accept-language'] || '',
    acceptEncoding: req.headers['accept-encoding'] || '',
    ipAddress: req.ip || '',
    xForwardedFor: req.headers['x-forwarded-for'] as string
  };
};