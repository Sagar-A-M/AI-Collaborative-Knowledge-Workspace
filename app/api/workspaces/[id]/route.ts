import { NextRequest } from "next/server";
import { ActivityType } from "@prisma/client";
import prisma from "@/lib/prisma";
import {
  requireWorkspaceMember,
  requireWorkspaceAdmin,
  requireWorkspaceOwner,
} from "@/lib/auth/workspace-auth";
import { updateWorkspaceSchema } from "@/lib/validations/workspace";
import { successResponse, handleApiError } from "@/lib/api-response";
import { logActivity } from "@/lib/activity";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const authContext = await requireWorkspaceMember(id);

    const workspace = await prisma.workspace.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            members: true,
            documents: true,
            folders: true,
          },
        },
      },
    });

    return successResponse({
      workspace: {
        ...workspace,
        currentRole: authContext.role,
        isOwner: authContext.isOwner,
        isAdmin: authContext.isAdmin,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const authContext = await requireWorkspaceAdmin(id);
    const body = await req.json();
    const validatedData = updateWorkspaceSchema.parse(body);

    const updatedWorkspace = await prisma.workspace.update({
      where: { id },
      data: {
        ...(validatedData.name !== undefined ? { name: validatedData.name } : {}),
        ...(validatedData.description !== undefined
          ? { description: validatedData.description }
          : {}),
        ...(validatedData.logo !== undefined ? { logo: validatedData.logo } : {}),
      },
    });

    await logActivity({
      workspaceId: id,
      userId: authContext.user.id,
      type: ActivityType.WORKSPACE_UPDATED,
      description: `${authContext.user.name || authContext.user.email} updated workspace details`,
    });

    return successResponse({ workspace: updatedWorkspace }, 200, "Workspace updated successfully");
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    await requireWorkspaceOwner(id);

    await prisma.workspace.delete({
      where: { id },
    });

    return successResponse({ deleted: true }, 200, "Workspace deleted successfully");
  } catch (error) {
    return handleApiError(error);
  }
}
