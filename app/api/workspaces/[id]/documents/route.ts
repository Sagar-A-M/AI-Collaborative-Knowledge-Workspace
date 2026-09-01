import { NextRequest } from "next/server";
import { ActivityType } from "@prisma/client";
import prisma from "@/lib/prisma";
import { requireWorkspaceMember } from "@/lib/auth/workspace-auth";
import { createDocumentSchema } from "@/lib/validations/document";
import { successResponse, handleApiError } from "@/lib/api-response";
import { logActivity } from "@/lib/activity";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    await requireWorkspaceMember(id);

    const searchParams = req.nextUrl.searchParams;
    const folderId = searchParams.get("folderId");
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : undefined;
    const recentOnly = searchParams.get("recent") === "true";

    const whereClause: {
      workspaceId: string;
      isArchived: boolean;
      folderId?: string | null;
    } = {
      workspaceId: id,
      isArchived: false,
    };

    if (folderId !== null && folderId !== undefined && folderId !== "all") {
      whereClause.folderId = folderId === "root" ? null : folderId;
    }

    const documents = await prisma.document.findMany({
      where: whereClause,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        folder: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            versions: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
      take: recentOnly ? 5 : limit,
    });

    return successResponse({
      documents: documents.map((doc) => ({
        id: doc.id,
        title: doc.title,
        content: doc.content,
        workspaceId: doc.workspaceId,
        folderId: doc.folderId,
        folder: doc.folder,
        authorId: doc.authorId,
        author: doc.author,
        versionsCount: doc._count.versions,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
      })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const authContext = await requireWorkspaceMember(id);
    const body = await req.json();
    const validatedData = createDocumentSchema.parse(body);

    const document = await prisma.$transaction(async (tx) => {
      const doc = await tx.document.create({
        data: {
          title: validatedData.title,
          content: validatedData.content || "",
          workspaceId: id,
          folderId: validatedData.folderId || null,
          authorId: authContext.user.id,
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
          folder: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      // Create initial version 1 snapshot
      await tx.documentVersion.create({
        data: {
          documentId: doc.id,
          title: doc.title,
          content: doc.content,
          versionNumber: 1,
          changeSummary: "Initial document creation",
          createdById: authContext.user.id,
        },
      });

      return doc;
    });

    await logActivity({
      workspaceId: id,
      userId: authContext.user.id,
      type: ActivityType.DOCUMENT_CREATED,
      description: `${authContext.user.name || authContext.user.email} created document "${document.title}"`,
      metadata: {
        documentId: document.id,
        documentTitle: document.title,
        folderId: document.folderId,
      },
    });

    return successResponse({ document }, 201, "Document created successfully");
  } catch (error) {
    return handleApiError(error);
  }
}
