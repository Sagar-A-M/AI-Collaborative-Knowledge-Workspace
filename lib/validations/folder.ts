import { z } from "zod";

export const createFolderSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Folder name is required")
    .max(60, "Folder name cannot exceed 60 characters"),
  parentId: z.string().trim().optional().nullable(),
});

export const updateFolderSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Folder name is required")
    .max(60, "Folder name cannot exceed 60 characters")
    .optional(),
  parentId: z.string().trim().optional().nullable(),
});

export type CreateFolderInput = z.infer<typeof createFolderSchema>;
export type UpdateFolderInput = z.infer<typeof updateFolderSchema>;
