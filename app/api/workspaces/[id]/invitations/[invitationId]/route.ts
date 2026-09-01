import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { requireWorkspaceAdmin } from "@/lib/auth/workspace-auth";
import { successResponse, handleApiError } from "@/lib/api-response";
import { NotFoundError } from "@/lib/errors";

interface RouteContext {
  params: Promise<{ id: string; invitationId: string }>;
}

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  try {
    const { id, invitationId } = await params;
    await requireWorkspaceAdmin(id);

    const invitation = await prisma.invitation.findUnique({
      where: { id: invitationId },
    });

    if (!invitation || invitation.workspaceId !== id) {
      throw new NotFoundError("Invitation not found");
    }

    await prisma.invitation.delete({
      where: { id: invitationId },
    });

    return successResponse({ revoked: true }, 200, "Invitation revoked successfully");
  } catch (error) {
    return handleApiError(error);
  }
}
