import { NextRequest } from "next/server";
import { requireWorkspaceMember } from "@/lib/auth/workspace-auth";
import { workspaceSummarySchema } from "@/lib/validations/ai";
import { generateWorkspaceSummary } from "@/services/ai/workspace-summary.service";
import { successResponse, handleApiError } from "@/lib/api-response";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    await requireWorkspaceMember(id);

    const body = await req.json().catch(() => ({}));
    const validatedData = workspaceSummarySchema.parse(body);

    const result = await generateWorkspaceSummary({
      workspaceId: id,
      includeRecentOnly: validatedData.includeRecentOnly,
    });

    return successResponse({ summary: result }, 200, "Workspace summary generated successfully");
  } catch (error) {
    return handleApiError(error);
  }
}
