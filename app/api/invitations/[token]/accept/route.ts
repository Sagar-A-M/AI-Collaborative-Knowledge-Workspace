import { NextRequest } from "next/server";
import { ActivityType } from "@prisma/client";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth/session";
import { successResponse, handleApiError } from "@/lib/api-response";
import { NotFoundError, ValidationError } from "@/lib/errors";
import { logActivity } from "@/lib/activity";

interface RouteContext {
  params: Promise<{ token: string }>;
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  try {
    const { token } = await params;
    const user = await requireAuth();

    const invitation = await prisma.invitation.findUnique({
      where: { token },
      include: {
        workspace: true,
      },
    });

    if (!invitation) {
      throw new NotFoundError("Invitation not found or has been revoked");
    }

    if (invitation.status !== "PENDING") {
      throw new ValidationError(
        `This invitation has already been ${invitation.status.toLowerCase()}`
      );
    }

    if (new Date(invitation.expiresAt) < new Date()) {
      await prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: "EXPIRED" },
      });
      throw new ValidationError("This invitation has expired");
    }

    // Check if user is already a member
    const existingMembership = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: invitation.workspaceId,
          userId: user.id,
        },
      },
    });

    if (!existingMembership) {
      // Create membership and mark invitation accepted
      await prisma.$transaction([
        prisma.workspaceMember.create({
          data: {
            workspaceId: invitation.workspaceId,
            userId: user.id,
            role: invitation.role,
          },
        }),
        prisma.invitation.update({
          where: { id: invitation.id },
          data: { status: "ACCEPTED" },
        }),
      ]);

      // Log activity
      await logActivity({
        workspaceId: invitation.workspaceId,
        userId: user.id,
        type: ActivityType.MEMBER_JOINED,
        description: `${user.name || user.email} joined the workspace as ${invitation.role}`,
        metadata: {
          role: invitation.role,
          invitedEmail: invitation.email,
        },
      });
    } else {
      // User is already a member, just mark invitation accepted
      await prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: "ACCEPTED" },
      });
    }

    return successResponse(
      {
        workspaceId: invitation.workspaceId,
        workspaceSlug: invitation.workspace.slug,
        workspaceName: invitation.workspace.name,
      },
      200,
      "Joined workspace successfully"
    );
  } catch (error) {
    return handleApiError(error);
  }
}
