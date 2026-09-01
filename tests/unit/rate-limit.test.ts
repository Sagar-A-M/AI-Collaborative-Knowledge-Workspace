import { describe, it, expect } from "vitest";
import { checkRateLimit, requireRateLimit } from "@/lib/rate-limit";
import { RateLimitError } from "@/lib/errors";

describe("Rate Limiting Unit Tests", () => {
  it("should allow requests within rate limit thresholds", async () => {
    const testId = `test-user-${Date.now()}`;
    const options = { maxRequests: 3, windowSeconds: 10 };

    const res1 = await checkRateLimit(testId, options);
    expect(res1.success).toBe(true);
    expect(res1.remaining).toBe(2);

    const res2 = await checkRateLimit(testId, options);
    expect(res2.success).toBe(true);
    expect(res2.remaining).toBe(1);

    const res3 = await checkRateLimit(testId, options);
    expect(res3.success).toBe(true);
    expect(res3.remaining).toBe(0);

    const res4 = await checkRateLimit(testId, options);
    expect(res4.success).toBe(false);
  });

  it("should throw RateLimitError when requireRateLimit threshold is exceeded", async () => {
    const testId = `test-user-require-${Date.now()}`;
    const options = { maxRequests: 2, windowSeconds: 10 };

    await expect(requireRateLimit(testId, options)).resolves.toBeDefined();
    await expect(requireRateLimit(testId, options)).resolves.toBeDefined();

    // 3rd attempt must throw RateLimitError
    await expect(requireRateLimit(testId, options)).rejects.toThrow(RateLimitError);
  });
});
