import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { requireWorkspaceMember } from "@/lib/auth/workspace-auth";
import { successResponse, handleApiError } from "@/lib/api-response";
import { NotFoundError } from "@/lib/errors";

interface RouteContext {
  params: Promise<{ id: string; documentId: string }>;
}

export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const { id, documentId } = await params;
    await requireWorkspaceMember(id);

    const document = await prisma.document.findUnique({
      where: { id: documentId },
      select: { id: true, workspaceId: true, isArchived: true },
    });

    if (!document || document.workspaceId !== id || document.isArchived) {
      throw new NotFoundError("Document not found in this workspace");
    }

    const versions = await prisma.documentVersion.findMany({
      where: { documentId },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: { versionNumber: "desc" },
    });

    return successResponse({
      versions: versions.map((v) => ({
        id: v.id,
        versionNumber: v.versionNumber,
        title: v.title,
        content: v.content,
        changeSummary: v.changeSummary,
        createdAt: v.createdAt,
        createdBy: v.createdBy,
        wordCount: v.content.trim() ? v.content.trim().split(/\s+/).length : 0,
        charCount: v.content.length,
      })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
