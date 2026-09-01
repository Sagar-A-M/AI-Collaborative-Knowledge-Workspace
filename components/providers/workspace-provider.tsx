"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import type { CreateWorkspaceInput, UpdateWorkspaceInput } from "@/lib/validations/workspace";
import type { ApiResponse } from "@/types/api";
import { Role } from "@prisma/client";

export interface WorkspaceItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo: string | null;
  role: Role;
  ownerId: string;
  owner?: {
    id: string;
    name: string | null;
    email: string;
  };
  createdAt: string;
  stats?: {
    membersCount: number;
    documentsCount: number;
    foldersCount: number;
  };
}

interface WorkspaceContextType {
  workspaces: WorkspaceItem[];
  activeWorkspace: WorkspaceItem | null;
  isLoading: boolean;
  createWorkspace: (
    data: CreateWorkspaceInput
  ) => Promise<{ success: boolean; workspace?: WorkspaceItem; error?: string }>;
  updateWorkspace: (
    id: string,
    data: UpdateWorkspaceInput
  ) => Promise<{ success: boolean; error?: string }>;
  deleteWorkspace: (id: string) => Promise<{ success: boolean; error?: string }>;
  switchWorkspace: (workspaceId: string) => void;
  refreshWorkspaces: () => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [workspaces, setWorkspaces] = useState<WorkspaceItem[]>([]);
  const [activeWorkspace, setActiveWorkspace] = useState<WorkspaceItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const currentWorkspaceId = params?.workspaceId as string | undefined;

  const fetchWorkspacesData = async () => {
    if (!user) {
      setWorkspaces([]);
      setActiveWorkspace(null);
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/workspaces", { cache: "no-store" });
      const data: ApiResponse<{ workspaces: WorkspaceItem[] }> = await res.json();

      if (data.success) {
        setWorkspaces(data.data.workspaces);
        if (data.data.workspaces.length > 0) {
          const match = currentWorkspaceId
            ? data.data.workspaces.find(
                (w) => w.id === currentWorkspaceId || w.slug === currentWorkspaceId
              )
            : data.data.workspaces[0];
          setActiveWorkspace(match || data.data.workspaces[0]);
        } else {
          setActiveWorkspace(null);
        }
      }
    } catch (error) {
      console.error("Failed to fetch workspaces:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    async function initializeWorkspaces() {
      if (!user) {
        if (isMounted) {
          setWorkspaces([]);
          setActiveWorkspace(null);
          setIsLoading(false);
        }
        return;
      }

      try {
        const res = await fetch("/api/workspaces", { cache: "no-store" });
        const data: ApiResponse<{ workspaces: WorkspaceItem[] }> = await res.json();

        if (isMounted && data.success) {
          setWorkspaces(data.data.workspaces);
          if (data.data.workspaces.length > 0) {
            const match = currentWorkspaceId
              ? data.data.workspaces.find(
                  (w) => w.id === currentWorkspaceId || w.slug === currentWorkspaceId
                )
              : data.data.workspaces[0];
            setActiveWorkspace(match || data.data.workspaces[0]);
          } else {
            setActiveWorkspace(null);
          }
        }
      } catch (error) {
        console.error("Failed to fetch workspaces:", error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    initializeWorkspaces();

    return () => {
      isMounted = false;
    };
  }, [user, currentWorkspaceId]);

  const createWorkspace = async (data: CreateWorkspaceInput) => {
    try {
      const res = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const json: ApiResponse<{ workspace: WorkspaceItem }> = await res.json();

      if (!json.success) {
        return { success: false, error: json.error.message };
      }

      await fetchWorkspacesData();
      setActiveWorkspace(json.data.workspace);
      return { success: true, workspace: json.data.workspace };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create workspace";
      return { success: false, error: message };
    }
  };

  const updateWorkspace = async (id: string, data: UpdateWorkspaceInput) => {
    try {
      const res = await fetch(`/api/workspaces/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const json: ApiResponse<{ workspace: WorkspaceItem }> = await res.json();

      if (!json.success) {
        return { success: false, error: json.error.message };
      }

      await fetchWorkspacesData();
      return { success: true };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update workspace";
      return { success: false, error: message };
    }
  };

  const deleteWorkspace = async (id: string) => {
    try {
      const res = await fetch(`/api/workspaces/${id}`, {
        method: "DELETE",
      });

      const json: ApiResponse<{ deleted: boolean }> = await res.json();

      if (!json.success) {
        return { success: false, error: json.error.message };
      }

      await fetchWorkspacesData();
      router.push("/dashboard");
      return { success: true };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to delete workspace";
      return { success: false, error: message };
    }
  };

  const switchWorkspace = (workspaceId: string) => {
    const found = workspaces.find((w) => w.id === workspaceId);
    if (found) {
      setActiveWorkspace(found);
      router.push(`/workspaces/${found.id}`);
    }
  };

  return (
    <WorkspaceContext.Provider
      value={{
        workspaces,
        activeWorkspace,
        isLoading,
        createWorkspace,
        updateWorkspace,
        deleteWorkspace,
        switchWorkspace,
        refreshWorkspaces: fetchWorkspacesData,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace(): WorkspaceContextType {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider");
  }
  return context;
}
