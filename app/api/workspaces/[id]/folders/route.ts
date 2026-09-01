import { NextRequest } from "next/server";
import { ActivityType } from "@prisma/client";
import prisma from "@/lib/prisma";
import { requireWorkspaceMember } from "@/lib/auth/workspace-auth";
import { createFolderSchema } from "@/lib/validations/folder";
import { successResponse, handleApiError } from "@/lib/api-response";
import { logActivity } from "@/lib/activity";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    await requireWorkspaceMember(id);

    const folders = await prisma.folder.findMany({
      where: { workspaceId: id },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
          },
        },
        children: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            documents: true,
            children: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    return successResponse({ folders });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const authContext = await requireWorkspaceMember(id);
    const body = await req.json();
    const validatedData = createFolderSchema.parse(body);

    const folder = await prisma.folder.create({
      data: {
        name: validatedData.name,
        workspaceId: id,
        parentId: validatedData.parentId || null,
      },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    await logActivity({
      workspaceId: id,
      userId: authContext.user.id,
      type: ActivityType.FOLDER_CREATED,
      description: `${authContext.user.name || authContext.user.email} created folder "${folder.name}"`,
      metadata: {
        folderId: folder.id,
        folderName: folder.name,
        parentId: folder.parentId,
      },
    });

    return successResponse({ folder }, 201, "Folder created successfully");
  } catch (error) {
    return handleApiError(error);
  }
}
