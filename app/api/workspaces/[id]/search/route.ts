import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { requireWorkspaceMember } from "@/lib/auth/workspace-auth";
import { successResponse, handleApiError } from "@/lib/api-response";
import { getOrSetCache } from "@/lib/cache";
import { checkRateLimit } from "@/lib/rate-limit";

interface RouteContext {
  params: Promise<{ id: string }>;
}

function extractSnippet(content: string, query: string, maxLength = 160): string {
  if (!content) return "";
  const lowerContent = content.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const matchIndex = lowerContent.indexOf(lowerQuery);

  if (matchIndex === -1) {
    return content.slice(0, maxLength).trim() + (content.length > maxLength ? "..." : "");
  }

  const start = Math.max(0, matchIndex - 60);
  const end = Math.min(content.length, matchIndex + query.length + 60);

  let snippet = content.slice(start, end).trim();
  if (start > 0) snippet = "..." + snippet;
  if (end < content.length) snippet = snippet + "...";

  return snippet;
}

export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const authContext = await requireWorkspaceMember(id);

    const searchParams = req.nextUrl.searchParams;
    const query = searchParams.get("q")?.trim() || "";
    const folderId = searchParams.get("folderId") || "all";
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : 20;

    if (!query) {
      return successResponse({
        query: "",
        results: [],
        total: 0,
      });
    }

    // Rate limiting: 60 searches per minute per user
    await checkRateLimit(`search:${authContext.user.id}`, {
      maxRequests: 60,
      windowSeconds: 60,
    });

    const cacheKey = `cache:search:${id}:${encodeURIComponent(query.toLowerCase())}:${folderId}:${limit}`;

    const searchResults = await getOrSetCache(cacheKey, 60, async () => {
      const whereClause: {
        workspaceId: string;
        isArchived: boolean;
        folderId?: string | null;
        OR?: Array<{
          title?: { contains: string; mode: "insensitive" };
          content?: { contains: string; mode: "insensitive" };
        }>;
      } = {
        workspaceId: id,
        isArchived: false,
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { content: { contains: query, mode: "insensitive" } },
        ],
      };

      if (folderId !== "all") {
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
        take: Math.min(limit, 50),
      });

      // Score and sort results: title matches rank higher than body-only matches
      const scoredResults = documents.map((doc) => {
        const lowerQuery = query.toLowerCase();
        const titleMatch = doc.title.toLowerCase().includes(lowerQuery);
        const contentMatch = doc.content.toLowerCase().includes(lowerQuery);

        let score = 0;
        if (titleMatch) score += 10;
        if (contentMatch) score += 5;

        return {
          id: doc.id,
          title: doc.title,
          snippet: extractSnippet(doc.content, query),
          folder: doc.folder,
          author: doc.author,
          versionsCount: doc._count.versions,
          updatedAt: doc.updatedAt,
          score,
          matchType: titleMatch && contentMatch ? "both" : titleMatch ? "title" : "content",
        };
      });

      scoredResults.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });

      return scoredResults;
    });

    return successResponse({
      query,
      results: searchResults,
      total: searchResults.length,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
