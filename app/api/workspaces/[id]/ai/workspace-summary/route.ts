import { NextRequest } from "next/server";
import { requireWorkspaceMember } from "@/lib/auth/workspace-auth";
import { workspaceSummarySchema } from "@/lib/validations/ai";
import { generateWorkspaceSummary } from "@/services/ai/workspace-summary.service";
import { successResponse, handleApiError } from "@/lib/api-response";
import { requireRateLimit } from "@/lib/rate-limit";
import { getOrSetCache } from "@/lib/cache";
import type { WorkspaceSummaryResult } from "@/services/ai/types";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const authContext = await requireWorkspaceMember(id);

    // Rate limit: 10 workspace summaries per minute
    await requireRateLimit(
      `ai-digest:${authContext.user.id}:${id}`,
      { maxRequests: 10, windowSeconds: 60 },
      "Workspace digest rate limit reached. Please wait before generating another digest."
    );

    const body = await req.json().catch(() => ({}));
    const validatedData = workspaceSummarySchema.parse(body);

    const cacheKey = `cache:ai:digest:${id}:${validatedData.includeRecentOnly}`;

    const result = await getOrSetCache<WorkspaceSummaryResult>(
      cacheKey,
      120, // 2 minutes cache TTL
      () =>
        generateWorkspaceSummary({
          workspaceId: id,
          includeRecentOnly: validatedData.includeRecentOnly,
        })
    );

    return successResponse({ summary: result }, 200, "Workspace summary generated successfully");
  } catch (error) {
    return handleApiError(error);
  }
}
