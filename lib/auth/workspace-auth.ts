import { Role } from "@prisma/client";
import prisma from "@/lib/prisma";
import { requireAuth, type SessionUser } from "./session";
import { ForbiddenError, NotFoundError } from "@/lib/errors";

export interface WorkspaceAuthContext {
  user: SessionUser;
  workspaceId: string;
  role: Role;
  isOwner: boolean;
  isAdmin: boolean;
  isMember: boolean;
}

/**
 * Checks and returns the membership of the authenticated user in a workspace.
 */
export async function getWorkspaceMembership(workspaceId: string, userId: string) {
  return prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId,
        userId,
      },
    },
    include: {
      workspace: true,
    },
  });
}

/**
 * Requires the user to be at least a MEMBER of the workspace.
 */
export async function requireWorkspaceMember(workspaceId: string): Promise<WorkspaceAuthContext> {
  const user = await requireAuth();

  const membership = await getWorkspaceMembership(workspaceId, user.id);

  if (!membership) {
    // Check if workspace exists
    const workspaceExists = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { id: true },
    });

    if (!workspaceExists) {
      throw new NotFoundError("Workspace not found");
    }

    throw new ForbiddenError("You are not a member of this workspace");
  }

  const isOwner = membership.role === Role.OWNER;
  const isAdmin = membership.role === Role.ADMIN || isOwner;

  return {
    user,
    workspaceId,
    role: membership.role,
    isOwner,
    isAdmin,
    isMember: true,
  };
}

/**
 * Requires the user to be an ADMIN or OWNER of the workspace.
 */
export async function requireWorkspaceAdmin(workspaceId: string): Promise<WorkspaceAuthContext> {
  const context = await requireWorkspaceMember(workspaceId);

  if (!context.isAdmin) {
    throw new ForbiddenError("Admin or Owner role is required for this operation");
  }

  return context;
}

/**
 * Requires the user to be the OWNER of the workspace.
 */
export async function requireWorkspaceOwner(workspaceId: string): Promise<WorkspaceAuthContext> {
  const context = await requireWorkspaceMember(workspaceId);

  if (!context.isOwner) {
    throw new ForbiddenError("Only the workspace Owner can perform this operation");
  }

  return context;
}
