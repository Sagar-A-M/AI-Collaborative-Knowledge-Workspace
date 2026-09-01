import { describe, it, expect } from "vitest";
import { sanitizeText, isValidEmail } from "@/lib/security/sanitize";
import {
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  RateLimitError,
} from "@/lib/errors";

describe("Security & Sanitization Unit Tests", () => {
  it("should strip malicious script tags and injection payloads", () => {
    const maliciousInput = "Hello <script>alert('pwned')</script> world!";
    const cleaned = sanitizeText(maliciousInput);
    expect(cleaned).toBe("Hello  world!");
    expect(cleaned).not.toContain("<script>");

    const iframePayload = "Check this <iframe src='evil.com' onload='steal()'></iframe>";
    const cleanedIframe = sanitizeText(iframePayload);
    expect(cleanedIframe).not.toContain("iframe");
    expect(cleanedIframe).not.toContain("onload=");

    const javascriptProtocol = "Click here javascript:steal()";
    expect(sanitizeText(javascriptProtocol)).not.toContain("javascript:");
  });

  it("should validate strict email address formats", () => {
    expect(isValidEmail("user@example.com")).toBe(true);
    expect(isValidEmail("engineer.lead+dev@company.io")).toBe(true);
    expect(isValidEmail("invalid-email")).toBe(false);
    expect(isValidEmail("@missing-username.com")).toBe(false);
    expect(isValidEmail("user@missing-tld")).toBe(false);
  });

  it("should instantiate custom AppError classes with correct HTTP status codes", () => {
    const valErr = new ValidationError("Invalid field");
    expect(valErr.statusCode).toBe(400);
    expect(valErr.code).toBe("VALIDATION_ERROR");

    const unauthErr = new UnauthorizedError();
    expect(unauthErr.statusCode).toBe(401);

    const forbErr = new ForbiddenError();
    expect(forbErr.statusCode).toBe(403);

    const notFoundErr = new NotFoundError("Workspace not found");
    expect(notFoundErr.statusCode).toBe(404);

    const conflictErr = new ConflictError("Email in use");
    expect(conflictErr.statusCode).toBe(409);

    const rateLimitErr = new RateLimitError();
    expect(rateLimitErr.statusCode).toBe(429);
  });
});
