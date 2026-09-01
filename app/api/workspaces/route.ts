import { NextRequest } from "next/server";
import { Role, ActivityType } from "@prisma/client";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth/session";
import { createWorkspaceSchema } from "@/lib/validations/workspace";
import { slugify } from "@/lib/utils";
import { successResponse, handleApiError } from "@/lib/api-response";
import { logActivity } from "@/lib/activity";

export async function GET() {
  try {
    const user = await requireAuth();

    const memberships = await prisma.workspaceMember.findMany({
      where: { userId: user.id },
      include: {
        workspace: {
          include: {
            _count: {
              select: {
                members: true,
                documents: true,
                folders: true,
              },
            },
            owner: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        joinedAt: "asc",
      },
    });

    const workspaces = memberships.map((m) => ({
      id: m.workspace.id,
      name: m.workspace.name,
      slug: m.workspace.slug,
      description: m.workspace.description,
      logo: m.workspace.logo,
      ownerId: m.workspace.ownerId,
      owner: m.workspace.owner,
      role: m.role,
      joinedAt: m.joinedAt,
      createdAt: m.workspace.createdAt,
      stats: {
        membersCount: m.workspace._count.members,
        documentsCount: m.workspace._count.documents,
        foldersCount: m.workspace._count.folders,
      },
    }));

    return successResponse({ workspaces });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const validatedData = createWorkspaceSchema.parse(body);

    // Generate unique slug
    let baseSlug = validatedData.slug || slugify(validatedData.name);
    if (!baseSlug) {
      baseSlug = "workspace";
    }

    let slug = baseSlug;
    let counter = 1;
    while (await prisma.workspace.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Create workspace and add owner as member in transaction
    const workspace = await prisma.$transaction(async (tx) => {
      const newWorkspace = await tx.workspace.create({
        data: {
          name: validatedData.name,
          slug,
          description: validatedData.description,
          ownerId: user.id,
          members: {
            create: {
              userId: user.id,
              role: Role.OWNER,
            },
          },
        },
        include: {
          members: true,
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      return newWorkspace;
    });

    // Record activity
    await logActivity({
      workspaceId: workspace.id,
      userId: user.id,
      type: ActivityType.WORKSPACE_CREATED,
      description: `${user.name || user.email} created workspace "${workspace.name}"`,
    });

    return successResponse(
      {
        workspace: {
          id: workspace.id,
          name: workspace.name,
          slug: workspace.slug,
          description: workspace.description,
          logo: workspace.logo,
          role: Role.OWNER,
          ownerId: workspace.ownerId,
          owner: workspace.owner,
          createdAt: workspace.createdAt,
        },
      },
      201,
      "Workspace created successfully"
    );
  } catch (error) {
    return handleApiError(error);
  }
}
