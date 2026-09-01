import { ActivityType } from "@prisma/client";
import prisma from "@/lib/prisma";

export interface LogActivityParams {
  workspaceId: string;
  userId: string;
  type: ActivityType;
  description: string;
  metadata?: Record<string, unknown>;
}

/**
 * Records an activity event in the workspace audit trail.
 */
export async function logActivity({
  workspaceId,
  userId,
  type,
  description,
  metadata,
}: LogActivityParams): Promise<void> {
  try {
    await prisma.activity.create({
      data: {
        workspaceId,
        userId,
        type,
        description,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    });
  } catch (error) {
    // We log but do not fail the main transaction if activity recording fails
    console.error("Failed to log activity event:", error);
  }
}
