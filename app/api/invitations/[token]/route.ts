import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { successResponse, handleApiError } from "@/lib/api-response";
import { NotFoundError } from "@/lib/errors";

interface RouteContext {
  params: Promise<{ token: string }>;
}

export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const { token } = await params;

    const invitation = await prisma.invitation.findUnique({
      where: { token },
      include: {
        workspace: {
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            logo: true,
          },
        },
        inviter: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!invitation) {
      throw new NotFoundError("Invitation not found or has been revoked");
    }

    const isExpired = new Date(invitation.expiresAt) < new Date();

    return successResponse({
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        status: invitation.status,
        expiresAt: invitation.expiresAt,
        isExpired,
        workspace: invitation.workspace,
        inviter: invitation.inviter,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
