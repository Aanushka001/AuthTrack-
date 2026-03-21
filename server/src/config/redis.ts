// ### server/src/config/redis.ts

import { logger } from '../utils/logger';

// Mock Redis client for development
class MockRedisClient {
  private data: Map<string, string> = new Map();

  async get(key: string): Promise<string | null> {
    return this.data.get(key) || null;
  }

  async set(key: string, value: string, ex?: number): Promise<void> {
    this.data.set(key, value);
    if (ex) {
      setTimeout(() => {
        this.data.delete(key);
      }, ex * 1000);
    }
  }

  async del(key: string): Promise<void> {
    this.data.delete(key);
  }

  async exists(key: string): Promise<boolean> {
    return this.data.has(key);
  }

  async keys(pattern: string): Promise<string[]> {
    const keys = Array.from(this.data.keys());
    if (pattern === '*') return keys;
    // Simple pattern matching for development
    const regex = new RegExp(pattern.replace('*', '.*'));
    return keys.filter(key => regex.test(key));
  }
}

let redisClient: MockRedisClient;

export async function initializeRedis(): Promise<void> {
  try {
    // In production, you would use actual Redis client like ioredis
    // const Redis = require('ioredis');
    // redisClient = new Redis({
    //   host: process.env.REDIS_HOST || 'localhost',
    //   port: parseInt(process.env.REDIS_PORT || '6379'),
    //   password: process.env.REDIS_PASSWORD,
    //   retryDelayOnFailover: 100,
    //   maxRetriesPerRequest: 3,
    // });

    // For development, use mock client
    redisClient = new MockRedisClient();
    
    logger.info('Redis initialized successfully');
  } catch (error) {
    logger.error('Redis initialization failed:', error);
    throw error;
  }
}

export function getRedisClient(): MockRedisClient {
  if (!redisClient) {
    throw new Error('Redis client not initialized. Call initializeRedis() first.');
  }
  return redisClient;
}