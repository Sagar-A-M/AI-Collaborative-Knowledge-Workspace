import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { requireWorkspaceMember } from "@/lib/auth/workspace-auth";
import { successResponse, handleApiError } from "@/lib/api-response";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const authContext = await requireWorkspaceMember(id);

    const members = await prisma.workspaceMember.findMany({
      where: { workspaceId: id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: [
        { role: "asc" }, // OWNER, ADMIN, MEMBER
        { joinedAt: "asc" },
      ],
    });

    // If caller is admin/owner, include pending invitations
    let invitations: {
      id: string;
      email: string;
      role: string;
      status: string;
      expiresAt: Date;
      createdAt: Date;
      inviter: {
        id: string;
        name: string | null;
        email: string;
      };
      token: string;
    }[] = [];

    if (authContext.isAdmin) {
      invitations = await prisma.invitation.findMany({
        where: {
          workspaceId: id,
          status: "PENDING",
          expiresAt: { gt: new Date() },
        },
        include: {
          inviter: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    }

    return successResponse({
      members: members.map((m) => ({
        id: m.id,
        userId: m.userId,
        role: m.role,
        joinedAt: m.joinedAt,
        user: m.user,
      })),
      invitations,
      currentMemberRole: authContext.role,
      canManageMembers: authContext.isAdmin,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
