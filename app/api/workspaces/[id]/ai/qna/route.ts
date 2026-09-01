import { NextRequest } from "next/server";
import { requireWorkspaceMember } from "@/lib/auth/workspace-auth";
import { workspaceQnASchema } from "@/lib/validations/ai";
import { answerWorkspaceQuestion } from "@/services/ai/workspace-qna.service";
import { successResponse, handleApiError } from "@/lib/api-response";
import { requireRateLimit } from "@/lib/rate-limit";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const authContext = await requireWorkspaceMember(id);

    // Rate limit: 15 AI Q&A requests per minute per user
    await requireRateLimit(
      `ai-qna:${authContext.user.id}:${id}`,
      { maxRequests: 15, windowSeconds: 60 },
      "AI request limit reached (15 queries/min). Please slow down."
    );

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
