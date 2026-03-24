import { logger } from '../utils/logger';

class MockRedisClient {
  private data: Map<string, string> = new Map();

  async get(key: string): Promise<string | null> {
    return this.data.get(key) ?? null;
  }

  async set(key: string, value: string, ex?: number): Promise<void> {
    this.data.set(key, value);
    if (ex) setTimeout(() => this.data.delete(key), ex * 1000);
  }

  async del(key: string): Promise<void> {
    this.data.delete(key);
  }

  async exists(key: string): Promise<boolean> {
    return this.data.has(key);
  }

  async keys(pattern: string): Promise<string[]> {
    const allKeys = Array.from(this.data.keys());
    if (pattern === '*') return allKeys;
    const regex = new RegExp(pattern.replace('*', '.*'));
    return allKeys.filter((k) => regex.test(k));
  }

  // Required by rate-limit-redis
  call(..._args: string[]): Promise<any> {
    return Promise.resolve(null);
  }
}

export let redisClient: MockRedisClient;

export async function initializeRedis(): Promise<void> {
  redisClient = new MockRedisClient();
  logger.info('Redis initialized (mock)');
}

export function getRedisClient(): MockRedisClient {
  if (!redisClient) throw new Error('Redis not initialized. Call initializeRedis() first.');
  return redisClient;
}