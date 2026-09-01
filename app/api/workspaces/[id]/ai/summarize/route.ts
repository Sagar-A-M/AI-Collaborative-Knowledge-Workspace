import { NextRequest } from "next/server";
import { requireWorkspaceMember } from "@/lib/auth/workspace-auth";
import { summarizeDocumentSchema } from "@/lib/validations/ai";
import { summarizeDocument } from "@/services/ai/document-summary.service";
import { successResponse, handleApiError } from "@/lib/api-response";
import { requireRateLimit } from "@/lib/rate-limit";
import { getOrSetCache } from "@/lib/cache";
import type { DocumentSummaryResult } from "@/services/ai/types";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const authContext = await requireWorkspaceMember(id);

    // Rate limit: 20 summary requests per minute per user
    await requireRateLimit(
      `ai-summarize:${authContext.user.id}:${id}`,
      { maxRequests: 20, windowSeconds: 60 },
      "AI summarization rate limit reached. Please wait a moment."
    );

    const body = await req.json();
    const validatedData = summarizeDocumentSchema.parse(body);

    const cacheKey = `cache:ai:summary:${validatedData.documentId}:${validatedData.format}`;

    const result = await getOrSetCache<DocumentSummaryResult>(
      cacheKey,
      300, // 5 minutes cache TTL
      () =>
        summarizeDocument({
          workspaceId: id,
          documentId: validatedData.documentId,
          format: validatedData.format,
        })
    );

    return successResponse({ summary: result }, 200, "Document summarized successfully");
  } catch (error) {
    return handleApiError(error);
  }
}
