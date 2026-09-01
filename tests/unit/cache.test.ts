import { describe, it, expect, vi } from "vitest";
import { setCache, getCache, deleteCache, getOrSetCache } from "@/lib/cache";

describe("Caching Layer Unit Tests", () => {
  it("should write to and read from cache correctly", async () => {
    const key = `test:cache:key:${Date.now()}`;
    const payload = { documentId: "doc-1", title: "API Architecture" };

    await setCache(key, payload, 60);

    const cached = await getCache<typeof payload>(key);
    expect(cached).toEqual(payload);

    await deleteCache(key);
    const deleted = await getCache(key);
    expect(deleted).toBeNull();
  });

  it("should fetch fresh data on cache miss and reuse cached value on hit", async () => {
    const key = `test:cache:getOrSet:${Date.now()}`;
    const fetcher = vi.fn().mockResolvedValue({ status: "active", count: 42 });

    // First call: fetcher called
    const result1 = await getOrSetCache(key, 60, fetcher);
    expect(result1).toEqual({ status: "active", count: 42 });
    expect(fetcher).toHaveBeenCalledTimes(1);

    // Second call: read from cache, fetcher NOT called again
    const result2 = await getOrSetCache(key, 60, fetcher);
    expect(result2).toEqual({ status: "active", count: 42 });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
});
