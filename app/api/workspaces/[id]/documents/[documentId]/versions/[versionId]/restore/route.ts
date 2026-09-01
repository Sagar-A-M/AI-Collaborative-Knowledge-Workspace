import { NextRequest } from "next/server";
import { ActivityType } from "@prisma/client";
import prisma from "@/lib/prisma";
import { requireWorkspaceMember } from "@/lib/auth/workspace-auth";
import { successResponse, handleApiError } from "@/lib/api-response";
import { NotFoundError } from "@/lib/errors";
import { logActivity } from "@/lib/activity";

interface RouteContext {
  params: Promise<{ id: string; documentId: string; versionId: string }>;
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  try {
    const { id, documentId, versionId } = await params;
    const authContext = await requireWorkspaceMember(id);

    const versionToRestore = await prisma.documentVersion.findUnique({
      where: { id: versionId },
      include: {
        document: true,
      },
    });

    if (
      !versionToRestore ||
      versionToRestore.documentId !== documentId ||
      versionToRestore.document.workspaceId !== id
    ) {
      throw new NotFoundError("Version snapshot not found");
    }

    const latestVersion = await prisma.documentVersion.findFirst({
      where: { documentId },
      orderBy: { versionNumber: "desc" },
      select: { versionNumber: true },
    });

    const nextVersionNumber = (latestVersion?.versionNumber || 0) + 1;

    // Transaction to update document and create restored version record
    const updatedDocument = await prisma.$transaction(async (tx) => {
      const doc = await tx.document.update({
        where: { id: documentId },
        data: {
          title: versionToRestore.title,
          content: versionToRestore.content,
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          folder: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      await tx.documentVersion.create({
        data: {
          documentId,
          title: versionToRestore.title,
          content: versionToRestore.content,
          versionNumber: nextVersionNumber,
          changeSummary: `Restored from version #${versionToRestore.versionNumber}`,
          createdById: authContext.user.id,
        },
      });

      return doc;
    });

    await logActivity({
      workspaceId: id,
      userId: authContext.user.id,
      type: ActivityType.DOCUMENT_RESTORED,
      description: `${authContext.user.name || authContext.user.email} restored document "${updatedDocument.title}" to version #${versionToRestore.versionNumber}`,
      metadata: {
        documentId: updatedDocument.id,
        restoredVersionNumber: versionToRestore.versionNumber,
        newVersionNumber: nextVersionNumber,
      },
    });

    return successResponse(
      {
        document: updatedDocument,
        restoredFromVersionNumber: versionToRestore.versionNumber,
        currentVersionNumber: nextVersionNumber,
      },
      200,
      `Document restored to version #${versionToRestore.versionNumber}`
    );
  } catch (error) {
    return handleApiError(error);
  }
}
