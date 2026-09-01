import { describe, it, expect } from "vitest";
import { getAiProvider } from "@/services/ai/provider";

describe("AI Knowledge Assistant Services Unit Tests", () => {
  const provider = getAiProvider();

  it("should initialize the AI provider correctly", () => {
    expect(provider).toBeDefined();
    expect(typeof provider.generateText).toBe("function");
  });

  it("should generate grounded summaries with bullet points", async () => {
    const prompt = `Summarize the following document for workspace team members.
Context:
Next.js 16 App Router provides enhanced caching and Turbopack support.
Database models are managed with PostgreSQL and Prisma ORM.
Security includes strict session cookies, bcrypt password hashing, and rate limiting.
Format: bullets`;

    const summary = await provider.generateText(prompt);
    expect(summary).toBeDefined();
    expect(summary.length).toBeGreaterThan(20);
    expect(summary).toContain("Executive Summary");
  });

  it("should generate contextual Q&A answers citing relevant workspace information", async () => {
    const prompt = `Answer the question based ONLY on the provided workspace documents.
Question: How is authentication handled in this workspace?
Workspace Documents:
Document: Auth Spec
Authentication utilizes bcryptjs password hashing and jose JWT session cookies.
`;

    const answer = await provider.generateText(prompt);
    expect(answer).toBeDefined();
    expect(answer).toContain("authentication");
  });
});
