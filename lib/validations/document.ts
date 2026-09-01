import { z } from "zod";

export const createDocumentSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Document title is required")
    .max(120, "Document title cannot exceed 120 characters"),
  content: z.string().default(""),
  folderId: z.string().trim().optional().nullable(),
});

export const updateDocumentSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Document title is required")
    .max(120, "Document title cannot exceed 120 characters")
    .optional(),
  content: z.string().optional(),
  folderId: z.string().trim().optional().nullable(),
});

export type CreateDocumentInput = z.infer<typeof createDocumentSchema>;
export type UpdateDocumentInput = z.infer<typeof updateDocumentSchema>;
