import { z } from "zod";
import { Role } from "@prisma/client";

export const inviteMemberSchema = z.object({
  email: z.string().trim().toLowerCase().email("Please enter a valid email address"),
  role: z.enum([Role.ADMIN, Role.MEMBER]).default(Role.MEMBER),
});

export const updateMemberRoleSchema = z.object({
  role: z.enum([Role.ADMIN, Role.MEMBER]),
});

export const acceptInvitationSchema = z.object({
  token: z.string().min(1, "Invitation token is required"),
});

export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>;
export type AcceptInvitationInput = z.infer<typeof acceptInvitationSchema>;
