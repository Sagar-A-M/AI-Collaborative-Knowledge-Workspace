import { NextRequest } from "next/server";
import { ActivityType } from "@prisma/client";
import prisma from "@/lib/prisma";
import { requireWorkspaceMember } from "@/lib/auth/workspace-auth";
import { updateFolderSchema } from "@/lib/validations/folder";
import { successResponse, handleApiError } from "@/lib/api-response";
import { NotFoundError } from "@/lib/errors";
import { logActivity } from "@/lib/activity";

interface RouteContext {
  params: Promise<{ id: string; folderId: string }>;
}

export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const { id, folderId } = await params;
    await requireWorkspaceMember(id);

    const folder = await prisma.folder.findUnique({
      where: { id: folderId },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
          },
        },
        children: {
          include: {
            _count: {
              select: {
                documents: true,
                children: true,
              },
            },
          },
        },
        documents: {
          where: { isArchived: false },
          include: {
            author: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
          orderBy: { updatedAt: "desc" },
        },
      },
    });

    if (!folder || folder.workspaceId !== id) {
      throw new NotFoundError("Folder not found in this workspace");
    }

    return successResponse({ folder });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  try {
    const { id, folderId } = await params;
    await requireWorkspaceMember(id);
    const body = await req.json();
    const validatedData = updateFolderSchema.parse(body);

    const existingFolder = await prisma.folder.findUnique({
      where: { id: folderId },
    });

    if (!existingFolder || existingFolder.workspaceId !== id) {
      throw new NotFoundError("Folder not found in this workspace");
    }

    const updatedFolder = await prisma.folder.update({
      where: { id: folderId },
      data: {
        ...(validatedData.name !== undefined ? { name: validatedData.name } : {}),
        ...(validatedData.parentId !== undefined ? { parentId: validatedData.parentId } : {}),
      },
    });

    return successResponse({ folder: updatedFolder }, 200, "Folder updated successfully");
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  try {
    const { id, folderId } = await params;
    const authContext = await requireWorkspaceMember(id);

    const existingFolder = await prisma.folder.findUnique({
      where: { id: folderId },
    });

    if (!existingFolder || existingFolder.workspaceId !== id) {
      throw new NotFoundError("Folder not found in this workspace");
    }

    await prisma.folder.delete({
      where: { id: folderId },
    });

    await logActivity({
      workspaceId: id,
      userId: authContext.user.id,
      type: ActivityType.FOLDER_DELETED,
      description: `${authContext.user.name || authContext.user.email} deleted folder "${existingFolder.name}"`,
      metadata: {
        folderId: existingFolder.id,
        folderName: existingFolder.name,
      },
    });

    return successResponse({ deleted: true }, 200, "Folder deleted successfully");
  } catch (error) {
    return handleApiError(error);
  }
}
