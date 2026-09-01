import { getRedisClient, isRedisAvailable } from "./redis";

// In-memory fallback cache with TTL
interface CacheEntry {
  value: string;
  expiresAt: number;
}

const memoryCache = new Map<string, CacheEntry>();

function cleanMemoryCache() {
  const now = Date.now();
  for (const [key, entry] of memoryCache.entries()) {
    if (entry.expiresAt <= now) {
      memoryCache.delete(key);
    }
  }
}

// Periodically clean expired entries in memory
if (typeof setInterval !== "undefined") {
  setInterval(cleanMemoryCache, 60000);
}

export async function getCache<T>(key: string): Promise<T | null> {
  const redis = getRedisClient();

  if (redis && isRedisAvailable()) {
    try {
      const data = await redis.get(key);
      if (data) {
        return JSON.parse(data) as T;
      }
    } catch {
      // Fallback to memory
    }
  }

  // Memory cache fallback
  const entry = memoryCache.get(key);
  if (entry) {
    if (entry.expiresAt > Date.now()) {
      try {
        return JSON.parse(entry.value) as T;
      } catch {
        return null;
      }
    }
    memoryCache.delete(key);
  }

  return null;
}

export async function setCache<T>(key: string, value: T, ttlSeconds = 60): Promise<void> {
  const serialized = JSON.stringify(value);
  const redis = getRedisClient();

  if (redis && isRedisAvailable()) {
    try {
      await redis.set(key, serialized, "EX", ttlSeconds);
    } catch {
      // Ignore and write to memory
    }
  }

  // Always write to memory cache as secondary tier
  memoryCache.set(key, {
    value: serialized,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
}

export async function deleteCache(key: string): Promise<void> {
  const redis = getRedisClient();

  if (redis && isRedisAvailable()) {
    try {
      await redis.del(key);
    } catch {
      // Ignore
    }
  }

  memoryCache.delete(key);
}

export async function getOrSetCache<T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>
): Promise<T> {
  const cached = await getCache<T>(key);
  if (cached !== null) {
    return cached;
  }

  const freshData = await fetcher();
  await setCache(key, freshData, ttlSeconds);
  return freshData;
}
