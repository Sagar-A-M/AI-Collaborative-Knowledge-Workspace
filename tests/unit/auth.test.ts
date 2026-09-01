import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { signJwt, verifyJwt } from "@/lib/auth/jwt";
import { signUpSchema } from "@/lib/validations/auth";
import { createWorkspaceSchema } from "@/lib/validations/workspace";
import { inviteMemberSchema } from "@/lib/validations/member";

describe("Authentication & Cryptography Unit Tests", () => {
  it("should securely hash and verify passwords", async () => {
    const rawPassword = "SuperSecurePassword123!";
    const hash = await hashPassword(rawPassword);

    expect(hash).toBeDefined();
    expect(hash).not.toEqual(rawPassword);

    const isValid = await verifyPassword(rawPassword, hash);
    expect(isValid).toBe(true);

    const isInvalid = await verifyPassword("WrongPassword123!", hash);
    expect(isInvalid).toBe(false);
  });

  it("should create and verify JWT session tokens", async () => {
    const payload = {
      userId: "user-test-123",
      email: "engineer@company.com",
      name: "Lead Engineer",
    };

    const token = await signJwt(payload);
    expect(typeof token).toBe("string");
    expect(token.split(".").length).toBe(3);

    const verified = await verifyJwt(token);
    expect(verified).toBeDefined();
    expect(verified?.userId).toBe(payload.userId);
    expect(verified?.email).toBe(payload.email);
  });

  it("should reject invalid/tampered JWT tokens", async () => {
    const invalidToken = "invalid.jwt.token";
    const verified = await verifyJwt(invalidToken);
    expect(verified).toBeNull();
  });

  it("should validate signup schema rules strictly", () => {
    const validData = {
      name: "Jane Doe",
      email: "jane@workspace.com",
      password: "password123",
    };

    const parsed = signUpSchema.safeParse(validData);
    expect(parsed.success).toBe(true);

    const invalidShortPassword = {
      name: "Jane Doe",
      email: "jane@workspace.com",
      password: "short",
    };
    expect(signUpSchema.safeParse(invalidShortPassword).success).toBe(false);

    const invalidEmail = {
      name: "Jane Doe",
      email: "not-an-email",
      password: "password123",
    };
    expect(signUpSchema.safeParse(invalidEmail).success).toBe(false);
  });

  it("should validate workspace creation and member invitation schemas", () => {
    const validWorkspace = {
      name: "Engineering Core",
      slug: "engineering-core",
      description: "Core platform specs and notes",
    };
    expect(createWorkspaceSchema.safeParse(validWorkspace).success).toBe(true);

    const validInvite = {
      email: "developer@team.com",
      role: "ADMIN",
    };
    expect(inviteMemberSchema.safeParse(validInvite).success).toBe(true);

    const invalidInviteRole = {
      email: "developer@team.com",
      role: "SUPER_ADMIN", // Invalid role
    };
    expect(inviteMemberSchema.safeParse(invalidInviteRole).success).toBe(false);
  });
});
