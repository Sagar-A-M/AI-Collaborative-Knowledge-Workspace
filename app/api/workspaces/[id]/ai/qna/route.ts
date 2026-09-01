import { NextRequest } from "next/server";
import { requireWorkspaceMember } from "@/lib/auth/workspace-auth";
import { workspaceQnASchema } from "@/lib/validations/ai";
import { answerWorkspaceQuestion } from "@/services/ai/workspace-qna.service";
import { successResponse, handleApiError } from "@/lib/api-response";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    await requireWorkspaceMember(id);

    const body = await req.json();
    const validatedData = workspaceQnASchema.parse(body);

    const result = await answerWorkspaceQuestion({
      workspaceId: id,
      question: validatedData.question,
      documentIds: validatedData.documentIds,
    });

    return successResponse({ answer: result }, 200, "Question answered successfully");
  } catch (error) {
    return handleApiError(error);
  }
}
