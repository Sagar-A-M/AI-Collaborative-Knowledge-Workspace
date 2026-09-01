import { z } from "zod";

export const summarizeDocumentSchema = z.object({
  documentId: z.string().trim().min(1, "Document ID is required"),
  format: z.enum(["bullets", "paragraph", "executive"]).default("bullets"),
});

export const workspaceQnASchema = z.object({
  question: z
    .string()
    .trim()
    .min(2, "Question must be at least 2 characters long")
    .max(500, "Question cannot exceed 500 characters"),
  documentIds: z.array(z.string().trim()).optional(),
});

export const workspaceSummarySchema = z.object({
  includeRecentOnly: z.boolean().default(false),
});

export type SummarizeDocumentInput = z.infer<typeof summarizeDocumentSchema>;
export type WorkspaceQnAInput = z.infer<typeof workspaceQnASchema>;
export type WorkspaceSummaryInput = z.infer<typeof workspaceSummarySchema>;
