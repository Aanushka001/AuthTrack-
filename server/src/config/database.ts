//server/src/config/database.ts

// import admin from 'firebase-admin';
// import { logger } from '../utils/logger';

// // Validate required environment variables
// const requiredEnvVars = [
//   'FIREBASE_PROJECT_ID',
//   'FIREBASE_PRIVATE_KEY',
//   'FIREBASE_CLIENT_EMAIL'
// ];

// for (const envVar of requiredEnvVars) {
//   if (!process.env[envVar]) {
//     throw new Error(`Missing required environment variable: ${envVar}`);
//   }
// }

// // Initialize these after the app is initialized
// let db: admin.firestore.Firestore;
// let auth: admin.auth.Auth;

// export { db, auth };

// export async function initializeDatabase(): Promise<void> {
//   try {
//     // Check if Firebase app is already initialized
//     if (!admin.apps.length) {
//       const serviceAccount = {
//         type: "service_account",
//         project_id: process.env.FIREBASE_PROJECT_ID,
//         private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
//         private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
//         client_email: process.env.FIREBASE_CLIENT_EMAIL,
//         client_id: process.env.FIREBASE_CLIENT_ID,
//         auth_uri: process.env.FIREBASE_AUTH_URI || "https://accounts.google.com/o/oauth2/auth",
//         token_uri: process.env.FIREBASE_TOKEN_URI || "https://oauth2.googleapis.com/token",
//         auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL || "https://www.googleapis.com/oauth2/v1/certs",
//         client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL
//       };

//       admin.initializeApp({
//         credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
//         projectId: process.env.FIREBASE_PROJECT_ID // Explicitly set project ID
//       });

//       logger.info('Firebase Admin SDK initialized successfully');
//     }
    
//     // Initialize the exports after the app is initialized
//     db = admin.firestore();
//     auth = admin.auth();
    
//     // Initialize the database service AFTER db is available
//     databaseService.initialize();
    
//     // Test database connection
//     await db.doc('health/check').set({ 
//       timestamp: admin.firestore.FieldValue.serverTimestamp(),
//       status: 'connected'
//     });
    
//     logger.info('Database initialized successfully');
//   } catch (error) {
//     logger.error('Database initialization failed:', error);
//     throw error;
//   }
// }

// export class DatabaseService {
//   private db: admin.firestore.Firestore | null = null;

//   constructor() {
//     // Don't initialize here - wait for explicit initialization
//   }

//   initialize(): void {
//     if (admin.apps.length > 0) {
//       this.db = admin.firestore();
//       logger.info('DatabaseService initialized');
//     } else {
//       logger.error('Cannot initialize DatabaseService: Firebase app not initialized');
//     }
//   }

//   private ensureInitialized(): admin.firestore.Firestore {
//     if (!this.db) {
//       if (admin.apps.length > 0) {
//         this.db = admin.firestore();
//       } else {
//         throw new Error('Database not initialized. Call initializeDatabase() first.');
//       }
//     }
//     return this.db;
//   }

//   async create<T extends { [key: string]: any }>(collection: string, data: T): Promise<string> {
//     const database = this.ensureInitialized();
//     const docRef = await database.collection(collection).add({
//       ...data,
//       createdAt: admin.firestore.FieldValue.serverTimestamp(),
//       updatedAt: admin.firestore.FieldValue.serverTimestamp()
//     });
//     return docRef.id;
//   }

//   async get<T>(collection: string, id: string): Promise<T | null> {
//     const database = this.ensureInitialized();
//     const doc = await database.collection(collection).doc(id).get();
//     return doc.exists ? ({ id: doc.id, ...doc.data() } as T) : null;
//   }

//   async update(collection: string, id: string, data: Partial<any>): Promise<void> {
//     const database = this.ensureInitialized();
//     await database.collection(collection).doc(id).update({
//       ...data,
//       updatedAt: admin.firestore.FieldValue.serverTimestamp()
//     });
//   }

//   async delete(collection: string, id: string): Promise<void> {
//     const database = this.ensureInitialized();
//     await database.collection(collection).doc(id).delete();
//   }

//   async query<T>(
//     collection: string, 
//     field: string, 
//     operator: FirebaseFirestore.WhereFilterOp, 
//     value: any
//   ): Promise<T[]> {
//     const database = this.ensureInitialized();
//     const snapshot = await database.collection(collection).where(field, operator, value).get();
//     return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
//   }

//   async paginate<T>(
//     collection: string,
//     limit: number,
//     startAfter?: any
//   ): Promise<{ data: T[]; lastDoc: any }> {
//     const database = this.ensureInitialized();
//     let query = database.collection(collection).limit(limit);
    
//     if (startAfter) {
//       query = query.startAfter(startAfter);
//     }
    
//     const snapshot = await query.get();
//     const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
//     const lastDoc = snapshot.docs[snapshot.docs.length - 1];
    
//     return { data, lastDoc };
//   }

//   // Batch operations for better performance
//   async batchWrite(operations: Array<{
//     type: 'create' | 'update' | 'delete';
//     collection: string;
//     id?: string;
//     data?: any;
//   }>): Promise<void> {
//     const database = this.ensureInitialized();
//     const batch = database.batch();

//     operations.forEach(op => {
//       const docRef = op.id 
//         ? database.collection(op.collection).doc(op.id)
//         : database.collection(op.collection).doc();

//       switch (op.type) {
//         case 'create':
//           batch.set(docRef, {
//             ...op.data,
//             createdAt: admin.firestore.FieldValue.serverTimestamp(),
//             updatedAt: admin.firestore.FieldValue.serverTimestamp()
//           });
//           break;
//         case 'update':
//           batch.update(docRef, {
//             ...op.data,
//             updatedAt: admin.firestore.FieldValue.serverTimestamp()
//           });
//           break;
//         case 'delete':
//           batch.delete(docRef);
//           break;
//       }
//     });

//     await batch.commit();
//   }
// }

// // Export a singleton instance
// export const databaseService = new DatabaseService();


//server/src/config/database.ts
//server/src/config/database.ts

import admin from 'firebase-admin';
import { logger } from '../utils/logger';

// Initialize these after the app is initialized
let db: admin.firestore.Firestore;
let auth: admin.auth.Auth;

export { db, auth };

// Validate required environment variables
function validateEnvironmentVariables(): void {
  const requiredEnvVars = [
    'FIREBASE_PROJECT_ID',
    'FIREBASE_PRIVATE_KEY',
    'FIREBASE_CLIENT_EMAIL'
  ];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      throw new Error(`Missing required environment variable: ${envVar}`);
    }
  }
}

export async function initializeDatabase(): Promise<void> {
  try {
    logger.info('Starting Firebase initialization...');
    
    // Validate environment variables when the function is called
    validateEnvironmentVariables();

    // Check if Firebase app is already initialized
    if (admin.apps.length > 0) {
      logger.info('Firebase app already initialized, skipping...');
      db = admin.firestore();
      auth = admin.auth();
      databaseService.initialize();
      return;
    }

    // Clean and format the private key properly
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;
    if (!privateKey) {
      throw new Error('FIREBASE_PRIVATE_KEY is not set');
    }

    // Clean the private key - remove extra quotes and fix newlines
    const cleanPrivateKey = privateKey
      .replace(/\\n/g, '\n') // Replace escaped newlines with actual newlines
      .replace(/^["']|["']$/g, '') // Remove surrounding quotes if any
      .trim();

    logger.info('Private key format validated');

    const serviceAccount = {
      type: "service_account",
      project_id: process.env.FIREBASE_PROJECT_ID,
      private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
      private_key: cleanPrivateKey,
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      client_id: process.env.FIREBASE_CLIENT_ID,
      auth_uri: process.env.FIREBASE_AUTH_URI || "https://accounts.google.com/o/oauth2/auth",
      token_uri: process.env.FIREBASE_TOKEN_URI || "https://oauth2.googleapis.com/token",
      auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL || "https://www.googleapis.com/oauth2/v1/certs",
      client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL
    };

    logger.info('Service account configuration prepared');

    // Initialize Firebase Admin SDK
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
      projectId: process.env.FIREBASE_PROJECT_ID
    });

    logger.info('Firebase Admin SDK initialized successfully');
    
    // Initialize the exports after the app is initialized
    db = admin.firestore();
    auth = admin.auth();
    
    logger.info('Firestore and Auth services initialized');
    
    // Initialize the database service AFTER db is available
    databaseService.initialize();
    
    // Test database connection with a simple operation
    try {
      await db.doc('health/check').set({ 
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        status: 'connected',
        environment: process.env.NODE_ENV || 'development'
      });
      logger.info('Database connection test successful');
    } catch (testError) {
      logger.error('Database connection test failed:', testError);
      throw testError;
    }
    
    logger.info('Database initialized successfully');
  } catch (error) {
    logger.error('Database initialization failed:', error);
    
    // Log additional debugging information
    logger.error('Environment check:', {
      hasProjectId: !!process.env.FIREBASE_PROJECT_ID,
      hasPrivateKey: !!process.env.FIREBASE_PRIVATE_KEY,
      hasClientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
      nodeEnv: process.env.NODE_ENV
    });
    
    throw error;
  }
}

export class DatabaseService {
  private db: admin.firestore.Firestore | null = null;

  constructor() {
    // Don't initialize here - wait for explicit initialization
  }

  initialize(): void {
    try {
      if (admin.apps.length > 0) {
        this.db = admin.firestore();
        logger.info('DatabaseService initialized successfully');
      } else {
        throw new Error('Cannot initialize DatabaseService: Firebase app not initialized');
      }
    } catch (error) {
      logger.error('DatabaseService initialization failed:', error);
      throw error;
    }
  }

  private ensureInitialized(): admin.firestore.Firestore {
    if (!this.db) {
      if (admin.apps.length > 0) {
        this.db = admin.firestore();
      } else {
        throw new Error('Database not initialized. Call initializeDatabase() first.');
      }
    }
    return this.db;
  }

  async create<T extends { [key: string]: any }>(collection: string, data: T): Promise<string> {
    const database = this.ensureInitialized();
    const docRef = await database.collection(collection).add({
      ...data,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    return docRef.id;
  }

  async get<T>(collection: string, id: string): Promise<T | null> {
    const database = this.ensureInitialized();
    const doc = await database.collection(collection).doc(id).get();
    return doc.exists ? ({ id: doc.id, ...doc.data() } as T) : null;
  }

  async update(collection: string, id: string, data: Partial<any>): Promise<void> {
    const database = this.ensureInitialized();
    await database.collection(collection).doc(id).update({
      ...data,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
  }

  async delete(collection: string, id: string): Promise<void> {
    const database = this.ensureInitialized();
    await database.collection(collection).doc(id).delete();
  }

  async query<T>(
    collection: string, 
    field: string, 
    operator: FirebaseFirestore.WhereFilterOp, 
    value: any
  ): Promise<T[]> {
    const database = this.ensureInitialized();
    const snapshot = await database.collection(collection).where(field, operator, value).get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
  }

  // Enhanced query method for multiple conditions
  async queryCompound<T>(
    collection: string,
    conditions: Array<{
      field: string;
      operator: FirebaseFirestore.WhereFilterOp;
      value: any;
    }>,
    orderBy?: { field: string; direction: 'asc' | 'desc' },
    limit?: number
  ): Promise<T[]> {
    const database = this.ensureInitialized();
    let query: FirebaseFirestore.Query = database.collection(collection);

    // Apply where conditions
    conditions.forEach(condition => {
      query = query.where(condition.field, condition.operator, condition.value);
    });

    // Apply ordering
    if (orderBy) {
      query = query.orderBy(orderBy.field, orderBy.direction);
    }

    // Apply limit
    if (limit) {
      query = query.limit(limit);
    }

    const snapshot = await query.get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
  }

  async paginate<T>(
    collection: string,
    limit: number,
    startAfter?: any
  ): Promise<{ data: T[]; lastDoc: any }> {
    const database = this.ensureInitialized();
    let query = database.collection(collection).limit(limit);
    
    if (startAfter) {
      query = query.startAfter(startAfter);
    }
    
    const snapshot = await query.get();
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
    const lastDoc = snapshot.docs[snapshot.docs.length - 1];
    
    return { data, lastDoc };
  }

  // Enhanced pagination with conditions
  async paginateWithConditions<T>(
    collection: string,
    conditions: Array<{
      field: string;
      operator: FirebaseFirestore.WhereFilterOp;
      value: any;
    }>,
    limit: number,
    orderBy?: { field: string; direction: 'asc' | 'desc' },
    startAfter?: any
  ): Promise<{ data: T[]; lastDoc: any }> {
    const database = this.ensureInitialized();
    let query: FirebaseFirestore.Query = database.collection(collection);

    // Apply where conditions
    conditions.forEach(condition => {
      query = query.where(condition.field, condition.operator, condition.value);
    });

    // Apply ordering
    if (orderBy) {
      query = query.orderBy(orderBy.field, orderBy.direction);
    }

    // Apply pagination
    if (startAfter) {
      query = query.startAfter(startAfter);
    }
    
    query = query.limit(limit);
    
    const snapshot = await query.get();
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
    const lastDoc = snapshot.docs[snapshot.docs.length - 1];
    
    return { data, lastDoc };
  }

  // Batch operations for better performance
  async batchWrite(operations: Array<{
    type: 'create' | 'update' | 'delete';
    collection: string;
    id?: string;
    data?: any;
  }>): Promise<void> {
    const database = this.ensureInitialized();
    const batch = database.batch();

    operations.forEach(op => {
      const docRef = op.id 
        ? database.collection(op.collection).doc(op.id)
        : database.collection(op.collection).doc();

      switch (op.type) {
        case 'create':
          batch.set(docRef, {
            ...op.data,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
          break;
        case 'update':
          batch.update(docRef, {
            ...op.data,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
          break;
        case 'delete':
          batch.delete(docRef);
          break;
      }
    });

    await batch.commit();
  }

  // Get direct Firestore instance for complex queries
  getFirestore(): admin.firestore.Firestore {
    return this.ensureInitialized();
  }
}

// Export a singleton instance
export const databaseService = new DatabaseService();