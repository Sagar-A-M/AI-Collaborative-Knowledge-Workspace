import Redis from "ioredis";

let redisClient: Redis | null = null;
let isRedisConnected = false;
let hasLoggedFailure = false;

export function getRedisClient(): Redis | null {
  if (redisClient) {
    return redisClient;
  }

  const redisUrl = process.env.REDIS_URL || process.env.REDIS_HOST;

  if (!redisUrl) {
    return null;
  }

  try {
    redisClient = new Redis(redisUrl, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
      connectTimeout: 2000,
      retryStrategy: () => null, // Don't infinite retry if host is unavailable
    });

    redisClient.on("connect", () => {
      isRedisConnected = true;
    });

    redisClient.on("ready", () => {
      isRedisConnected = true;
    });

    redisClient.on("error", (err) => {
      isRedisConnected = false;
      if (!hasLoggedFailure) {
        console.warn(
          "[Redis] Connection error, operating in in-memory fallback mode:",
          err.message
        );
        hasLoggedFailure = true;
      }
    });

    redisClient.on("close", () => {
      isRedisConnected = false;
    });

    // Attempt non-blocking connection
    redisClient.connect().catch(() => {
      isRedisConnected = false;
    });

    return redisClient;
  } catch {
    return null;
  }
}

export function isRedisAvailable(): boolean {
  return isRedisConnected && redisClient !== null;
}
