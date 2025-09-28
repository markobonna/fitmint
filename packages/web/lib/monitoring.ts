import { Counter, Histogram, Gauge, register, collectDefaultMetrics } from 'prom-client';

// Collect default metrics (CPU, memory, etc.)
collectDefaultMetrics();

// Custom metrics for FitMint
export const claimCounter = new Counter({
  name: 'fitmint_claims_total',
  help: 'Total number of reward claims',
  labelNames: ['status', 'user_verified', 'streak_level'],
});

export const verificationCounter = new Counter({
  name: 'fitmint_verifications_total',
  help: 'Total number of World ID verifications',
  labelNames: ['status', 'verification_level'],
});

export const apiLatency = new Histogram({
  name: 'fitmint_api_latency_seconds',
  help: 'API endpoint latency in seconds',
  labelNames: ['method', 'endpoint', 'status_code'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 2, 3, 5, 7, 10],
});

export const healthDataSync = new Counter({
  name: 'fitmint_health_sync_total',
  help: 'Health data synchronization operations',
  labelNames: ['source', 'status', 'data_type'],
});

export const activeUsers = new Gauge({
  name: 'fitmint_active_users',
  help: 'Number of active users in the last 24 hours',
  labelNames: ['timeframe'],
});

export const challengeParticipation = new Gauge({
  name: 'fitmint_challenge_participants',
  help: 'Number of participants in active challenges',
  labelNames: ['challenge_id', 'challenge_name'],
});

export const rewardPoolBalance = new Gauge({
  name: 'fitmint_reward_pool_balance_wld',
  help: 'Current reward pool balance in WLD tokens',
});

export const userStreakDistribution = new Histogram({
  name: 'fitmint_user_streak_days',
  help: 'Distribution of user streak lengths',
  buckets: [1, 3, 7, 14, 30, 60, 100, 365],
});

export const cacheHitRate = new Counter({
  name: 'fitmint_cache_operations_total',
  help: 'Cache hit/miss operations',
  labelNames: ['operation', 'cache_type'],
});

export const databaseConnections = new Gauge({
  name: 'fitmint_database_connections',
  help: 'Number of active database connections',
  labelNames: ['pool_name', 'status'],
});

export const notificationsSent = new Counter({
  name: 'fitmint_notifications_sent_total',
  help: 'Total number of notifications sent',
  labelNames: ['type', 'status', 'channel'],
});

// Error tracking
export const errorCounter = new Counter({
  name: 'fitmint_errors_total',
  help: 'Total number of application errors',
  labelNames: ['error_type', 'endpoint', 'severity'],
});

// Business metrics
export const dailyStepGoalAchievement = new Counter({
  name: 'fitmint_daily_goal_achievements_total',
  help: 'Number of users achieving daily step goals',
  labelNames: ['goal_type', 'achievement_level'],
});

export const leaderboardQueries = new Counter({
  name: 'fitmint_leaderboard_queries_total',
  help: 'Number of leaderboard queries',
  labelNames: ['timeframe', 'cached'],
});

// Utility functions
export class MetricsCollector {
  static trackApiCall(req: any, res: any, duration: number) {
    const endpoint = req.url || 'unknown';
    const method = req.method || 'unknown';
    const statusCode = res.status?.toString() || '500';
    
    apiLatency
      .labels(method, endpoint, statusCode)
      .observe(duration);
  }

  static trackClaim(status: 'success' | 'failed', userVerified: boolean, streakDays: number) {
    const streakLevel = streakDays >= 100 ? 'legendary' : 
                      streakDays >= 30 ? 'champion' :
                      streakDays >= 7 ? 'committed' : 'beginner';
    
    claimCounter
      .labels(status, userVerified.toString(), streakLevel)
      .inc();
  }

  static trackVerification(status: 'success' | 'failed', level: string) {
    verificationCounter
      .labels(status, level)
      .inc();
  }

  static trackHealthDataSync(source: string, status: 'success' | 'failed', dataType: string) {
    healthDataSync
      .labels(source, status, dataType)
      .inc();
  }

  static updateActiveUsers(count: number, timeframe: '1h' | '24h' | '7d' | '30d') {
    activeUsers
      .labels(timeframe)
      .set(count);
  }

  static updateChallengeParticipation(challengeId: string, challengeName: string, count: number) {
    challengeParticipation
      .labels(challengeId, challengeName)
      .set(count);
  }

  static updateRewardPool(balance: number) {
    rewardPoolBalance.set(balance);
  }

  static trackUserStreak(streakDays: number) {
    userStreakDistribution.observe(streakDays);
  }

  static trackCacheOperation(operation: 'hit' | 'miss' | 'set' | 'delete', cacheType: 'redis' | 'memory') {
    cacheHitRate
      .labels(operation, cacheType)
      .inc();
  }

  static updateDatabaseConnections(poolName: string, active: number, idle: number) {
    databaseConnections.labels(poolName, 'active').set(active);
    databaseConnections.labels(poolName, 'idle').set(idle);
  }

  static trackNotification(type: string, status: 'sent' | 'failed', channel: string) {
    notificationsSent
      .labels(type, status, channel)
      .inc();
  }

  static trackError(errorType: string, endpoint: string, severity: 'low' | 'medium' | 'high' | 'critical') {
    errorCounter
      .labels(errorType, endpoint, severity)
      .inc();
  }

  static trackGoalAchievement(goalType: 'steps' | 'exercise' | 'both', level: 'basic' | 'exceeded') {
    dailyStepGoalAchievement
      .labels(goalType, level)
      .inc();
  }

  static trackLeaderboardQuery(timeframe: string, cached: boolean) {
    leaderboardQueries
      .labels(timeframe, cached.toString())
      .inc();
  }
}

// Middleware for automatic API tracking
export function createMetricsMiddleware() {
  return (req: any, res: any, next: any) => {
    const start = Date.now();
    
    res.on('finish', () => {
      const duration = (Date.now() - start) / 1000;
      MetricsCollector.trackApiCall(req, res, duration);
    });
    
    next();
  };
}

// Export metrics endpoint
export async function getMetrics() {
  return register.metrics();
}

// Health check endpoint
export function getHealthStatus() {
  return {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.env.npm_package_version || '1.0.0',
  };
}

export default register;