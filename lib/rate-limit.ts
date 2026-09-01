import { getRedisClient, isRedisAvailable } from "./redis";
import { RateLimitError } from "./errors";

interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

interface RateLimitOptions {
  maxRequests: number;
  windowSeconds: number;
}

// In-memory fallback tracking for rate limits
interface MemoryRateLimitBucket {
  count: number;
  resetAt: number;
}

const memoryBuckets = new Map<string, MemoryRateLimitBucket>();

export async function checkRateLimit(
  identifier: string,
  options: RateLimitOptions
): Promise<RateLimitResult> {
  const { maxRequests, windowSeconds } = options;
  const now = Date.now();
  const resetTime = Math.ceil((now + windowSeconds * 1000) / 1000);
  const key = `ratelimit:${identifier}`;

  const redis = getRedisClient();

  if (redis && isRedisAvailable()) {
    try {
      const current = await redis.incr(key);
      if (current === 1) {
        await redis.expire(key, windowSeconds);
      }

      const remaining = Math.max(0, maxRequests - current);
      return {
        success: current <= maxRequests,
        limit: maxRequests,
        remaining,
        reset: resetTime,
      };
    } catch {
      // Fallback to in-memory tracking
    }
  }

  // Memory fallback
  const bucket = memoryBuckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    memoryBuckets.set(key, {
      count: 1,
      resetAt: now + windowSeconds * 1000,
    });

    return {
      success: true,
      limit: maxRequests,
      remaining: maxRequests - 1,
      reset: resetTime,
    };
  }

  bucket.count += 1;
  const isAllowed = bucket.count <= maxRequests;
  const remaining = Math.max(0, maxRequests - bucket.count);

  return {
    success: isAllowed,
    limit: maxRequests,
    remaining,
    reset: Math.ceil(bucket.resetAt / 1000),
  };
}

export async function requireRateLimit(
  identifier: string,
  options: RateLimitOptions,
  customErrorMessage?: string
): Promise<RateLimitResult> {
  const result = await checkRateLimit(identifier, options);

  if (!result.success) {
    throw new RateLimitError(
      customErrorMessage ||
        `Rate limit exceeded (${options.maxRequests} requests per ${options.windowSeconds}s). Please wait before retrying.`
    );
  }

  return result;
}
