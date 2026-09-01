import prisma from "@/lib/prisma";
import { NotFoundError } from "@/lib/errors";
import { getAiProvider } from "./provider";
import type { SummarizeDocumentOptions, DocumentSummaryResult } from "./types";

export async function summarizeDocument(
  options: SummarizeDocumentOptions
): Promise<DocumentSummaryResult> {
  const { workspaceId, documentId, format = "bullets" } = options;

  const document = await prisma.document.findUnique({
    where: { id: documentId },
    select: {
      id: true,
      title: true,
      content: true,
      workspaceId: true,
      isArchived: true,
    },
  });

  if (!document || document.workspaceId !== workspaceId || document.isArchived) {
    throw new NotFoundError("Document not found in this workspace");
  }

  if (!document.content.trim()) {
    return {
      documentId: document.id,
      documentTitle: document.title,
      summary: "This document is currently empty.",
      keyPoints: [],
      format,
    };
  }

  const provider = getAiProvider();
  const systemPrompt =
    "You are a professional knowledge assistant. Your job is to generate accurate, concise, and structured summaries of documents.";

  const prompt = `Please summarize the following document.
Document Title: ${document.title}
Format: ${format}

Context:
${document.content.slice(0, 8000)}

Instructions:
1. Provide a concise overview of the document.
2. Highlight the most important key points as bullet items.
3. Keep the tone factual and professional.`;

  const rawSummary = await provider.generateText(prompt, systemPrompt);

  const lines = rawSummary.split("\n").map((l) => l.trim());
  const bulletLines = lines
    .filter((l) => l.startsWith("•") || l.startsWith("-") || l.startsWith("*") || /^\d+\./.test(l))
    .map((l) => l.replace(/^[•\-*]\s*|\d+\.\s*/, "").trim())
    .filter((l) => l.length > 5);

  return {
    documentId: document.id,
    documentTitle: document.title,
    summary: rawSummary,
    keyPoints: bulletLines.slice(0, 6),
    format,
  };
}
