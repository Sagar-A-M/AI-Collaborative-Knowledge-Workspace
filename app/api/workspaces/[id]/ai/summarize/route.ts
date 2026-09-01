import { NextRequest } from "next/server";
import { requireWorkspaceMember } from "@/lib/auth/workspace-auth";
import { summarizeDocumentSchema } from "@/lib/validations/ai";
import { summarizeDocument } from "@/services/ai/document-summary.service";
import { successResponse, handleApiError } from "@/lib/api-response";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    await requireWorkspaceMember(id);

    const body = await req.json();
    const validatedData = summarizeDocumentSchema.parse(body);

    const result = await summarizeDocument({
      workspaceId: id,
      documentId: validatedData.documentId,
      format: validatedData.format,
    });

    return successResponse({ summary: result }, 200, "Document summarized successfully");
  } catch (error) {
    return handleApiError(error);
  }
}
