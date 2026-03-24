import admin from 'firebase-admin';
import { logger } from '../utils/logger';

if (!admin.apps.length) {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!process.env.FIREBASE_PROJECT_ID || !privateKey || !process.env.FIREBASE_CLIENT_EMAIL) {
    logger.warn('Firebase env vars missing — Firebase will not be initialized');
  } else {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      }),
    });
    logger.info('Firebase initialized', { projectId: process.env.FIREBASE_PROJECT_ID });
  }
}

export const db = admin.apps.length ? admin.firestore() : null as any;
export const auth = admin.apps.length ? admin.auth() : null as any;