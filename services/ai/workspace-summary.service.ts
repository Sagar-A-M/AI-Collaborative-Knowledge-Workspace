import prisma from "@/lib/prisma";
import { NotFoundError } from "@/lib/errors";
import { getAiProvider } from "./provider";
import type { WorkspaceSummaryOptions, WorkspaceSummaryResult } from "./types";

export async function generateWorkspaceSummary(
  options: WorkspaceSummaryOptions
): Promise<WorkspaceSummaryResult> {
  const { workspaceId, includeRecentOnly = false } = options;

  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { id: true, name: true, description: true },
  });

  if (!workspace) {
    throw new NotFoundError("Workspace not found");
  }

  const documents = await prisma.document.findMany({
    where: {
      workspaceId,
      isArchived: false,
    },
    select: {
      id: true,
      title: true,
      content: true,
      folder: { select: { name: true } },
      updatedAt: true,
    },
    orderBy: { updatedAt: "desc" },
    take: includeRecentOnly ? 10 : 30,
  });

  if (documents.length === 0) {
    return {
      workspaceId: workspace.id,
      workspaceName: workspace.name,
      summary:
        "This workspace has no active documents yet. Create documents to generate knowledge digests.",
      totalDocumentsAnalyzed: 0,
      keyTopics: [],
      generatedAt: new Date().toISOString(),
    };
  }

  const documentsListing = documents
    .map(
      (d) =>
        `- "${d.title}" (${d.folder ? `Folder: ${d.folder.name}` : "Root"}): ${d.content.slice(0, 150)}...`
    )
    .join("\n");

  const provider = getAiProvider();
  const systemPrompt =
    "You are an executive knowledge synthesizer for team workspaces. Produce concise executive summaries highlighting active themes, projects, and knowledge areas.";

  const prompt = `Workspace Name: ${workspace.name}
Workspace Description: ${workspace.description || "N/A"}
Total Documents: ${documents.length}

Documents Inventory:
${documentsListing}

Instructions:
1. Provide an executive summary of this workspace's knowledge base.
2. Identify the primary knowledge domains and topics covered.
3. List 3 to 5 key topic tags.`;

  const rawSummary = await provider.generateText(prompt, systemPrompt);

  // Extract key topics from document titles and folders
  const topicSet = new Set<string>();
  documents.forEach((d) => {
    if (d.folder?.name) topicSet.add(d.folder.name);
    const words = d.title.split(/\s+/).filter((w) => w.length > 4);
    words.slice(0, 2).forEach((w) => topicSet.add(w));
  });

  return {
    workspaceId: workspace.id,
    workspaceName: workspace.name,
    summary: rawSummary,
    totalDocumentsAnalyzed: documents.length,
    keyTopics: Array.from(topicSet).slice(0, 6),
    generatedAt: new Date().toISOString(),
  };
}
