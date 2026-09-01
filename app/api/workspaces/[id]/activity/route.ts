import { NextRequest } from "next/server";
import { ActivityType } from "@prisma/client";
import prisma from "@/lib/prisma";
import { requireWorkspaceMember } from "@/lib/auth/workspace-auth";
import { successResponse, handleApiError } from "@/lib/api-response";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    await requireWorkspaceMember(id);

    const searchParams = req.nextUrl.searchParams;
    const typeParam = searchParams.get("type");
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : 50;

    const whereClause: {
      workspaceId: string;
      type?: ActivityType;
    } = {
      workspaceId: id,
    };

    if (typeParam && Object.values(ActivityType).includes(typeParam as ActivityType)) {
      whereClause.type = typeParam as ActivityType;
    }

    const activities = await prisma.activity.findMany({
      where: whereClause,
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
      orderBy: { createdAt: "desc" },
      take: Math.min(limit, 100),
    });

    return successResponse({
      activities: activities.map((act) => {
        let parsedMetadata: Record<string, unknown> | null = null;
        if (act.metadata) {
          try {
            parsedMetadata = JSON.parse(act.metadata);
          } catch {
            parsedMetadata = null;
          }
        }

        return {
          id: act.id,
          type: act.type,
          description: act.description,
          metadata: parsedMetadata,
          createdAt: act.createdAt,
          user: act.user,
        };
      }),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
