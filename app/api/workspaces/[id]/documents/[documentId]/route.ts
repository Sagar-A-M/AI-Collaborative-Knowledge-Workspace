import { NextRequest } from "next/server";
import { ActivityType } from "@prisma/client";
import prisma from "@/lib/prisma";
import { requireWorkspaceMember } from "@/lib/auth/workspace-auth";
import { updateDocumentSchema } from "@/lib/validations/document";
import { successResponse, handleApiError } from "@/lib/api-response";
import { NotFoundError } from "@/lib/errors";
import { logActivity } from "@/lib/activity";

interface RouteContext {
  params: Promise<{ id: string; documentId: string }>;
}

export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const { id, documentId } = await params;
    await requireWorkspaceMember(id);

    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        folder: {
          select: {
            id: true,
            name: true,
            parentId: true,
          },
        },
        _count: {
          select: {
            versions: true,
          },
        },
      },
    });

    if (!document || document.workspaceId !== id || document.isArchived) {
      throw new NotFoundError("Document not found in this workspace");
    }

    return successResponse({
      document: {
        ...document,
        versionsCount: document._count.versions,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  try {
    const { id, documentId } = await params;
    const authContext = await requireWorkspaceMember(id);
    const body = await req.json();
    const validatedData = updateDocumentSchema.parse(body);

    const existingDoc = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        versions: {
          orderBy: { versionNumber: "desc" },
          take: 1,
        },
      },
    });

    if (!existingDoc || existingDoc.workspaceId !== id || existingDoc.isArchived) {
      throw new NotFoundError("Document not found in this workspace");
    }

    const hasContentChanged =
      validatedData.content !== undefined && validatedData.content !== existingDoc.content;
    const hasTitleChanged =
      validatedData.title !== undefined && validatedData.title !== existingDoc.title;

    const updatedDocument = await prisma.$transaction(async (tx) => {
      const doc = await tx.document.update({
        where: { id: documentId },
        data: {
          ...(validatedData.title !== undefined ? { title: validatedData.title } : {}),
          ...(validatedData.content !== undefined ? { content: validatedData.content } : {}),
          ...(validatedData.folderId !== undefined ? { folderId: validatedData.folderId } : {}),
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

      // If content or title changed meaningfully, save a new version snapshot
      if (hasContentChanged || hasTitleChanged) {
        const lastVersion = existingDoc.versions[0];
        const nextVersionNumber = (lastVersion?.versionNumber || 0) + 1;

        await tx.documentVersion.create({
          data: {
            documentId: doc.id,
            title: doc.title,
            content: doc.content,
            versionNumber: nextVersionNumber,
            changeSummary:
              hasTitleChanged && hasContentChanged
                ? "Updated title and content"
                : hasTitleChanged
                  ? "Updated title"
                  : "Updated content",
            createdById: authContext.user.id,
          },
        });
      }

      return doc;
    });

    await logActivity({
      workspaceId: id,
      userId: authContext.user.id,
      type: ActivityType.DOCUMENT_UPDATED,
      description: `${authContext.user.name || authContext.user.email} updated document "${updatedDocument.title}"`,
      metadata: {
        documentId: updatedDocument.id,
        documentTitle: updatedDocument.title,
      },
    });

    return successResponse({ document: updatedDocument }, 200, "Document updated successfully");
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  try {
    const { id, documentId } = await params;
    const authContext = await requireWorkspaceMember(id);

    const existingDoc = await prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!existingDoc || existingDoc.workspaceId !== id) {
      throw new NotFoundError("Document not found in this workspace");
    }

    await prisma.document.delete({
      where: { id: documentId },
    });

    await logActivity({
      workspaceId: id,
      userId: authContext.user.id,
      type: ActivityType.DOCUMENT_DELETED,
      description: `${authContext.user.name || authContext.user.email} deleted document "${existingDoc.title}"`,
      metadata: {
        documentId: existingDoc.id,
        documentTitle: existingDoc.title,
      },
    });

    return successResponse({ deleted: true }, 200, "Document deleted successfully");
  } catch (error) {
    return handleApiError(error);
  }
}
