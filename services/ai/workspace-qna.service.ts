import prisma from "@/lib/prisma";
import { getAiProvider } from "./provider";
import type { WorkspaceQnAOptions, QnAResult, QnACitation } from "./types";

export async function answerWorkspaceQuestion(options: WorkspaceQnAOptions): Promise<QnAResult> {
  const { workspaceId, question, documentIds, maxContextDocs = 5 } = options;

  const whereClause: {
    workspaceId: string;
    isArchived: boolean;
    id?: { in: string[] };
  } = {
    workspaceId,
    isArchived: false,
  };

  if (documentIds && documentIds.length > 0) {
    whereClause.id = { in: documentIds };
  }

  // Fetch workspace documents
  const allDocs = await prisma.document.findMany({
    where: whereClause,
    select: {
      id: true,
      title: true,
      content: true,
      updatedAt: true,
    },
    orderBy: { updatedAt: "desc" },
    take: 20,
  });

  if (allDocs.length === 0) {
    return {
      answer: "No documents were found in this workspace to answer your question.",
      citations: [],
      relevantDocumentsCount: 0,
    };
  }

  // Filter and score documents based on question keywords
  const keywords = question
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 2);

  const scoredDocs = allDocs.map((doc) => {
    let score = 0;
    const lowerTitle = doc.title.toLowerCase();
    const lowerContent = doc.content.toLowerCase();

    for (const kw of keywords) {
      if (lowerTitle.includes(kw)) score += 5;
      if (lowerContent.includes(kw)) score += 2;
    }

    return { ...doc, score };
  });

  // Select top relevant documents
  scoredDocs.sort((a, b) => b.score - a.score);
  const relevantDocs = scoredDocs.slice(0, maxContextDocs);

  const citations: QnACitation[] = relevantDocs.map((doc) => ({
    documentId: doc.id,
    title: doc.title,
    snippet: doc.content.slice(0, 180).trim() + (doc.content.length > 180 ? "..." : ""),
  }));

  const contextBundle = relevantDocs
    .map(
      (doc, index) =>
        `--- Document [${index + 1}]: "${doc.title}" (ID: ${doc.id}) ---\n${doc.content.slice(0, 2500)}`
    )
    .join("\n\n");

  const provider = getAiProvider();
  const systemPrompt =
    "You are an AI Knowledge Assistant for a team collaborative workspace. Answer questions accurately and factually using ONLY the provided workspace documents. Always reference which documents you used.";

  const prompt = `User Question:
"${question}"

Workspace Documents:
${contextBundle}

Instructions:
1. Answer the user's question clearly based strictly on the provided documents.
2. If the documents do not contain enough information to answer the question, state that fact politely.
3. Cite the relevant document titles in your explanation.`;

  const answer = await provider.generateText(prompt, systemPrompt);

  return {
    answer,
    citations,
    relevantDocumentsCount: relevantDocs.length,
  };
}
