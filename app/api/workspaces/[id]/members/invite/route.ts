import { NextRequest } from "next/server";
import crypto from "crypto";
import { ActivityType } from "@prisma/client";
import prisma from "@/lib/prisma";
import { requireWorkspaceAdmin } from "@/lib/auth/workspace-auth";
import { inviteMemberSchema } from "@/lib/validations/member";
import { successResponse, handleApiError } from "@/lib/api-response";
import { ConflictError } from "@/lib/errors";
import { logActivity } from "@/lib/activity";
import { requireRateLimit } from "@/lib/rate-limit";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const authContext = await requireWorkspaceAdmin(id);

    // Rate limit: 15 member invites per minute per admin
    await requireRateLimit(
      `invite-member:${authContext.user.id}:${id}`,
      { maxRequests: 15, windowSeconds: 60 },
      "Invite rate limit reached. Please wait before sending more invitations."
    );

    const body = await req.json();
    const validatedData = inviteMemberSchema.parse(body);

    // Check if a user with this email is already a member
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      const existingMembership = await prisma.workspaceMember.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId: id,
            userId: existingUser.id,
          },
        },
      });

      if (existingMembership) {
        throw new ConflictError("User is already a member of this workspace");
      }
    }

    // Generate secure random token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Upsert invitation for this email in this workspace
    const invitation = await prisma.invitation.upsert({
      where: {
        token:
          (
            await prisma.invitation.findFirst({
              where: { workspaceId: id, email: validatedData.email },
              select: { token: true },
            })
          )?.token || token,
      },
      update: {
        token,
        role: validatedData.role,
        status: "PENDING",
        expiresAt,
        inviterId: authContext.user.id,
      },
      create: {
        workspaceId: id,
        email: validatedData.email,
        role: validatedData.role,
        token,
        status: "PENDING",
        expiresAt,
        inviterId: authContext.user.id,
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
    });

    // Record activity
    await logActivity({
      workspaceId: id,
      userId: authContext.user.id,
      type: ActivityType.MEMBER_INVITED,
      description: `${authContext.user.name || authContext.user.email} invited ${invitation.email} as ${invitation.role}`,
      metadata: {
        invitedEmail: invitation.email,
        role: invitation.role,
      },
    });

    const inviteUrl = `/invite/${invitation.token}`;

    return successResponse(
      {
        invitation,
        inviteUrl,
      },
      201,
      "Invitation generated successfully"
    );
  } catch (error) {
    return handleApiError(error);
  }
}
