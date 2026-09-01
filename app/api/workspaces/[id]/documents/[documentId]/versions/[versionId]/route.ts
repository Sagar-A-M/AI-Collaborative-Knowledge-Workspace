import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { requireWorkspaceMember } from "@/lib/auth/workspace-auth";
import { successResponse, handleApiError } from "@/lib/api-response";
import { NotFoundError } from "@/lib/errors";

interface RouteContext {
  params: Promise<{ id: string; documentId: string; versionId: string }>;
}

export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const { id, documentId, versionId } = await params;
    await requireWorkspaceMember(id);

    const version = await prisma.documentVersion.findUnique({
      where: { id: versionId },
      include: {
        document: {
          select: { id: true, workspaceId: true },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    if (!version || version.documentId !== documentId || version.document.workspaceId !== id) {
      throw new NotFoundError("Version snapshot not found");
    }

    return successResponse({ version });
  } catch (error) {
    return handleApiError(error);
  }
}
