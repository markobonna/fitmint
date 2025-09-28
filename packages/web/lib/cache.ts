import Redis from 'ioredis';

// Redis client (only create if REDIS_URL is available)
let redis: Redis | null = null;

if (process.env.REDIS_URL) {
  try {
    redis = new Redis(process.env.REDIS_URL, {
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      connectTimeout: 10000,
      commandTimeout: 5000,
    });

    redis.on('error', (err) => {
      console.error('Redis connection error:', err);
    });

    redis.on('connect', () => {
      console.log('Connected to Redis');
    });
  } catch (error) {
    console.error('Failed to initialize Redis:', error);
    redis = null;
  }
}

// In-memory cache fallback
const memoryCache = new Map<string, { value: any; expires: number }>();

export class CacheService {
  static async get<T>(key: string): Promise<T | null> {
    try {
      // Try Redis first
      if (redis) {
        const data = await redis.get(key);
        return data ? JSON.parse(data) : null;
      }

      // Fallback to memory cache
      const cached = memoryCache.get(key);
      if (cached && cached.expires > Date.now()) {
        return cached.value;
      }
      
      // Remove expired entry
      if (cached) {
        memoryCache.delete(key);
      }

      return null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  static async set(key: string, value: any, ttl?: number) {
    try {
      const data = JSON.stringify(value);

      // Try Redis first
      if (redis) {
        if (ttl) {
          await redis.setex(key, ttl, data);
        } else {
          await redis.set(key, data);
        }
        return;
      }

      // Fallback to memory cache
      const expires = ttl ? Date.now() + (ttl * 1000) : Date.now() + (3600 * 1000); // Default 1 hour
      memoryCache.set(key, { value, expires });

      // Clean up memory cache periodically
      if (memoryCache.size > 1000) {
        this.cleanupMemoryCache();
      }
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  static async invalidate(pattern: string) {
    try {
      // Try Redis first
      if (redis) {
        const keys = await redis.keys(pattern);
        if (keys.length > 0) {
          await redis.del(...keys);
        }
        return;
      }

      // Fallback to memory cache
      const keysToDelete = Array.from(memoryCache.keys()).filter(key => 
        key.includes(pattern.replace('*', ''))
      );
      
      keysToDelete.forEach(key => memoryCache.delete(key));
    } catch (error) {
      console.error('Cache invalidation error:', error);
    }
  }

  private static cleanupMemoryCache() {
    const now = Date.now();
    for (const [key, cached] of memoryCache.entries()) {
      if (cached.expires <= now) {
        memoryCache.delete(key);
      }
    }
  }

  // Health Data Caching
  static async getHealthData(userId: string) {
    const key = `health:${userId}`;
    return await this.get(key);
  }

  static async setHealthData(userId: string, data: any) {
    const key = `health:${userId}`;
    await this.set(key, data, 300); // 5 minute cache for health data
  }

  // User Stats Caching with Smart Invalidation
  static async getUserStats(userId: string) {
    const key = `user:stats:${userId}`;
    const cached = await this.get(key);
    
    if (cached) return cached;
    
    // If not cached, this would typically fetch from database
    // For now, return null to indicate cache miss
    return null;
  }

  static async setUserStats(userId: string, stats: any) {
    const key = `user:stats:${userId}`;
    await this.set(key, stats, 3600); // 1 hour cache for user stats
  }

  // Leaderboard Caching
  static async getLeaderboard(timeframe: string) {
    const key = `leaderboard:${timeframe}`;
    const cached = await this.get(key);
    
    if (cached) return cached;
    
    // Generate mock leaderboard data if not cached
    const mockLeaderboard = this.generateMockLeaderboard();
    await this.set(key, mockLeaderboard, 300); // 5 minute cache
    
    return mockLeaderboard;
  }

  private static generateMockLeaderboard() {
    const names = ['Alex Runner', 'Sarah Sprint', 'Mike Miles', 'Lisa Leap', 'Tom Trek', 'Emma Endure', 'Jake Jog', 'Maya March'];
    const avatars = names.map((_, i) => `https://api.dicebear.com/7.x/avataaars/svg?seed=${i}`);
    
    const leaderboard = names.map((name, index) => ({
      rank: index + 1,
      username: name,
      avatar: avatars[index],
      totalSteps: Math.max(150000 - (index * 15000) + Math.random() * 10000, 50000),
      streak: Math.floor(Math.random() * 30) + 1,
      totalWLD: Math.floor((150 - index * 15) + Math.random() * 20),
      change: ['up', 'down', 'same'][Math.floor(Math.random() * 3)] as 'up' | 'down' | 'same'
    }));

    const userRank = {
      rank: 12,
      username: 'You',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user',
      totalSteps: 89500,
      streak: 5,
      totalWLD: 67,
      change: 'up' as const
    };

    return { leaderboard, userRank };
  }

  // Challenge Data Caching
  static async getChallenges() {
    const key = 'challenges:active';
    const cached = await this.get(key);
    
    if (cached) return cached;
    
    // Mock challenges data
    const challenges = [
      {
        id: '1',
        name: 'Weekend Warrior',
        description: 'Complete 50,000 steps over the weekend',
        targetSteps: 50000,
        participants: 1234,
        prizePool: 500,
        timeLeft: '2 days',
        progress: 0
      },
      {
        id: '2',
        name: 'Lunch Break Walker',
        description: 'Walk 5,000 steps during lunch hours this week',
        targetSteps: 5000,
        participants: 856,
        prizePool: 200,
        timeLeft: '4 days',
        progress: 0
      }
    ];
    
    await this.set(key, challenges, 600); // 10 minute cache
    return challenges;
  }

  // Application Metrics Caching
  static async getMetrics() {
    const key = 'metrics:global';
    const cached = await this.get(key);
    
    if (cached) return cached;
    
    // Mock metrics data
    const metrics = {
      totalUsers: 12547,
      activeUsers: 3847,
      dailyActiveUsers: 1523,
      totalRewardsDistributed: 156230,
      averageStepsPerUser: 8342,
      systemHealth: 'healthy',
      pendingClaims: 23,
      fraudAlerts: 2,
      todayTotalSteps: 12500000,
      todayGoalAchievement: 89
    };
    
    await this.set(key, metrics, 300); // 5 minute cache
    return metrics;
  }

  // Smart Cache Warming
  static async warmCache() {
    console.log('Warming cache with frequently accessed data...');
    
    try {
      // Pre-load leaderboards for different timeframes
      await Promise.all([
        this.getLeaderboard('daily'),
        this.getLeaderboard('weekly'),
        this.getLeaderboard('allTime')
      ]);
      
      // Pre-load challenges
      await this.getChallenges();
      
      // Pre-load global metrics
      await this.getMetrics();
      
      console.log('Cache warming completed');
    } catch (error) {
      console.error('Cache warming error:', error);
    }
  }

  // Cache Statistics
  static async getStats() {
    const stats = {
      redisConnected: redis !== null,
      memoryCacheSize: memoryCache.size,
      redisInfo: null as any
    };

    if (redis) {
      try {
        const info = await redis.info('memory');
        stats.redisInfo = info;
      } catch (error) {
        console.error('Failed to get Redis info:', error);
      }
    }

    return stats;
  }

  // Batch Operations
  static async setBatch(entries: Array<{ key: string; value: any; ttl?: number }>) {
    try {
      if (redis) {
        const pipeline = redis.pipeline();
        
        entries.forEach(({ key, value, ttl }) => {
          const data = JSON.stringify(value);
          if (ttl) {
            pipeline.setex(key, ttl, data);
          } else {
            pipeline.set(key, data);
          }
        });
        
        await pipeline.exec();
        return;
      }

      // Fallback to memory cache
      entries.forEach(({ key, value, ttl }) => {
        const expires = ttl ? Date.now() + (ttl * 1000) : Date.now() + (3600 * 1000);
        memoryCache.set(key, { value, expires });
      });
    } catch (error) {
      console.error('Batch set error:', error);
    }
  }

  static async getBatch(keys: string[]) {
    try {
      if (redis) {
        const results = await redis.mget(keys);
        return results.map(result => result ? JSON.parse(result) : null);
      }

      // Fallback to memory cache
      const now = Date.now();
      return keys.map(key => {
        const cached = memoryCache.get(key);
        if (cached && cached.expires > now) {
          return cached.value;
        }
        return null;
      });
    } catch (error) {
      console.error('Batch get error:', error);
      return keys.map(() => null);
    }
  }
}

// Export convenience functions
export const cache = {
  get: CacheService.get.bind(CacheService),
  set: CacheService.set.bind(CacheService),
  invalidate: CacheService.invalidate.bind(CacheService),
  getHealthData: CacheService.getHealthData.bind(CacheService),
  setHealthData: CacheService.setHealthData.bind(CacheService),
  getUserStats: CacheService.getUserStats.bind(CacheService),
  setUserStats: CacheService.setUserStats.bind(CacheService),
  getLeaderboard: CacheService.getLeaderboard.bind(CacheService),
  getChallenges: CacheService.getChallenges.bind(CacheService),
  getMetrics: CacheService.getMetrics.bind(CacheService),
  warmCache: CacheService.warmCache.bind(CacheService),
  getStats: CacheService.getStats.bind(CacheService)
};