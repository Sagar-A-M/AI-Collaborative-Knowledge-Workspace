import { NextRequest } from "next/server";
import { Role, ActivityType } from "@prisma/client";
import prisma from "@/lib/prisma";
import { requireWorkspaceMember, requireWorkspaceAdmin } from "@/lib/auth/workspace-auth";
import { updateMemberRoleSchema } from "@/lib/validations/member";
import { successResponse, handleApiError } from "@/lib/api-response";
import { ForbiddenError, NotFoundError } from "@/lib/errors";
import { logActivity } from "@/lib/activity";

interface RouteContext {
  params: Promise<{ id: string; memberId: string }>;
}

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  try {
    const { id, memberId } = await params;
    const authContext = await requireWorkspaceAdmin(id);
    const body = await req.json();
    const validatedData = updateMemberRoleSchema.parse(body);

    const targetMember = await prisma.workspaceMember.findUnique({
      where: { id: memberId },
      include: { user: true },
    });

    if (!targetMember || targetMember.workspaceId !== id) {
      throw new NotFoundError("Member not found in this workspace");
    }

    // Protect workspace owner
    if (targetMember.role === Role.OWNER) {
      throw new ForbiddenError("Cannot change role of the workspace Owner");
    }

    // Only OWNER can modify an ADMIN's role
    if (targetMember.role === Role.ADMIN && !authContext.isOwner) {
      throw new ForbiddenError("Only the workspace Owner can change an Admin's role");
    }

    const updatedMember = await prisma.workspaceMember.update({
      where: { id: memberId },
      data: { role: validatedData.role },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    await logActivity({
      workspaceId: id,
      userId: authContext.user.id,
      type: ActivityType.MEMBER_ROLE_CHANGED,
      description: `${authContext.user.name || authContext.user.email} changed ${targetMember.user.name || targetMember.user.email}'s role to ${validatedData.role}`,
      metadata: {
        targetUserId: targetMember.userId,
        newRole: validatedData.role,
      },
    });

    return successResponse({ member: updatedMember }, 200, "Member role updated");
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  try {
    const { id, memberId } = await params;
    const authContext = await requireWorkspaceMember(id);

    const targetMember = await prisma.workspaceMember.findUnique({
      where: { id: memberId },
      include: { user: true },
    });

    if (!targetMember || targetMember.workspaceId !== id) {
      throw new NotFoundError("Member not found in this workspace");
    }

    // Check permissions: either the user is removing themselves, or the user is an admin/owner
    const isSelf = targetMember.userId === authContext.user.id;

    if (!isSelf && !authContext.isAdmin) {
      throw new ForbiddenError("Admin permission required to remove members");
    }

    // Cannot remove workspace owner
    if (targetMember.role === Role.OWNER) {
      throw new ForbiddenError("Cannot remove the workspace Owner");
    }

    // An ADMIN cannot remove another ADMIN unless they are OWNER
    if (!isSelf && targetMember.role === Role.ADMIN && !authContext.isOwner) {
      throw new ForbiddenError("Only the workspace Owner can remove an Admin");
    }

    await prisma.workspaceMember.delete({
      where: { id: memberId },
    });

    await logActivity({
      workspaceId: id,
      userId: authContext.user.id,
      type: ActivityType.MEMBER_REMOVED,
      description: isSelf
        ? `${targetMember.user.name || targetMember.user.email} left the workspace`
        : `${authContext.user.name || authContext.user.email} removed ${targetMember.user.name || targetMember.user.email} from the workspace`,
      metadata: {
        targetUserId: targetMember.userId,
        wasSelf: isSelf,
      },
    });

    return successResponse({ removed: true }, 200, "Member removed successfully");
  } catch (error) {
    return handleApiError(error);
  }
}
