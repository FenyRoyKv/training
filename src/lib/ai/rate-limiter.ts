/**
 * ============================================================
 * RATE LIMITER & TOKEN MANAGEMENT
 * ============================================================
 * 
 * Demonstrates:
 * 1. Request rate limiting (requests per minute)
 * 2. Token usage tracking
 * 3. Sliding window rate limiting
 * 4. Token budget management
 */

// In-memory storage (use Redis in production)
const requestLog: Map<string, number[]> = new Map();
const tokenUsage: Map<string, { used: number; limit: number; resetAt: Date }> = new Map();

// Configuration
const RATE_LIMIT_CONFIG = {
  REQUESTS_PER_MINUTE: 3,
  TOKENS_PER_DAY: 100000,
  WINDOW_MS: 60 * 1000, // 1 minute
};

/**
 * Check if request is within rate limit
 * Uses sliding window algorithm
 */
export function checkRateLimit(userId: string): {
  allowed: boolean;
  remaining: number;
  resetIn: number;
} {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_CONFIG.WINDOW_MS;

  // Get user's request timestamps
  const userRequests = requestLog.get(userId) || [];

  // Filter out requests outside the window
  const recentRequests = userRequests.filter((timestamp) => timestamp > windowStart);

  // Check if under limit
  const allowed = recentRequests.length < RATE_LIMIT_CONFIG.REQUESTS_PER_MINUTE;
  const remaining = Math.max(0, RATE_LIMIT_CONFIG.REQUESTS_PER_MINUTE - recentRequests.length);

  // Calculate when the oldest request in window will expire
  const oldestRequest = recentRequests[0];
  const resetIn = oldestRequest
    ? Math.ceil((oldestRequest + RATE_LIMIT_CONFIG.WINDOW_MS - now) / 1000)
    : 0;

  if (allowed) {
    // Record this request
    recentRequests.push(now);
    requestLog.set(userId, recentRequests);
  }

  return { allowed, remaining, resetIn };
}

/**
 * Track token usage for a user
 */
export function trackTokenUsage(
  userId: string,
  tokensUsed: number
): {
  allowed: boolean;
  used: number;
  limit: number;
  remaining: number;
} {
  const now = new Date();
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);

  // Get or initialize user's token usage
  let usage = tokenUsage.get(userId);

  // Reset if it's a new day
  if (!usage || usage.resetAt < now) {
    usage = {
      used: 0,
      limit: RATE_LIMIT_CONFIG.TOKENS_PER_DAY,
      resetAt: endOfDay,
    };
  }

  // Check if within limit
  const wouldExceed = usage.used + tokensUsed > usage.limit;

  if (!wouldExceed) {
    usage.used += tokensUsed;
    tokenUsage.set(userId, usage);
  }

  return {
    allowed: !wouldExceed,
    used: usage.used,
    limit: usage.limit,
    remaining: Math.max(0, usage.limit - usage.used),
  };
}

/**
 * Estimate tokens for a message (rough estimation)
 * In production, use tiktoken or similar library
 */
export function estimateTokens(text: string): number {
  // Rough estimation: ~4 characters per token for English
  return Math.ceil(text.length / 4);
}

/**
 * Get rate limit headers for API response
 */
export function getRateLimitHeaders(userId: string): Record<string, string> {
  const rateLimit = checkRateLimit(userId);
  const tokens = tokenUsage.get(userId);

  return {
    "X-RateLimit-Limit": String(RATE_LIMIT_CONFIG.REQUESTS_PER_MINUTE),
    "X-RateLimit-Remaining": String(rateLimit.remaining),
    "X-RateLimit-Reset": String(rateLimit.resetIn),
    "X-TokenLimit-Used": String(tokens?.used || 0),
    "X-TokenLimit-Remaining": String(tokens ? tokens.limit - tokens.used : RATE_LIMIT_CONFIG.TOKENS_PER_DAY),
  };
}
