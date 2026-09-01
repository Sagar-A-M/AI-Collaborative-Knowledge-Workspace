"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { CreateFolderModal } from "@/components/folders/create-folder-modal";
import {
  FolderTree,
  FolderPlus,
  Folder,
  FileText,
  Trash2,
  Loader2,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import type { ApiResponse } from "@/types/api";

interface FolderItem {
  id: string;
  name: string;
  parentId: string | null;
  parent?: {
    id: string;
    name: string;
  } | null;
  children: {
    id: string;
    name: string;
  }[];
  _count: {
    documents: number;
    children: number;
  };
}

export default function WorkspaceFoldersPage() {
  const params = useParams();
  const workspaceId = params?.workspaceId as string;

  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [parentFolderForNew, setParentFolderForNew] = useState<string | null>(null);

  const reloadFolders = async () => {
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/folders`);
      const data: ApiResponse<{ folders: FolderItem[] }> = await res.json();

      if (data.success) {
        setFolders(data.data.folders);
      } else {
        setError(data.error.message);
      }
    } catch {
      setError("Failed to load folders");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    async function initialize() {
      try {
        const res = await fetch(`/api/workspaces/${workspaceId}/folders`);
        const data: ApiResponse<{ folders: FolderItem[] }> = await res.json();

        if (isMounted) {
          if (data.success) {
            setFolders(data.data.folders);
          } else {
            setError(data.error.message);
          }
        }
      } catch {
        if (isMounted) {
          setError("Failed to load folders");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    initialize();

    return () => {
      isMounted = false;
    };
  }, [workspaceId]);

  const handleDeleteFolder = async (folderId: string, folderName: string) => {
    if (
      !confirm(
        `Are you sure you want to delete folder "${folderName}"? Contained documents will be moved to root.`
      )
    ) {
      return;
    }

    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/folders/${folderId}`, {
        method: "DELETE",
      });

      const data: ApiResponse<{ deleted: boolean }> = await res.json();

      if (!data.success) {
        setError(data.error.message);
        return;
      }

      setSuccess(`Folder "${folderName}" deleted`);
      reloadFolders();
    } catch {
      setError("Failed to delete folder");
    }
  };

  if (isLoading) {
    return (
      <div className="p-12 flex items-center justify-center text-slate-400">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <main className="p-8 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2.5">
            <FolderTree className="h-6 w-6 text-indigo-400" />
            <span>Folder Organization &amp; Hierarchy</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Organize workspace knowledge documents into structured directories
          </p>
        </div>

        <button
          onClick={() => {
            setParentFolderForNew(null);
            setIsModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-medium text-xs shadow-lg shadow-cyan-600/25 transition-all self-start sm:self-auto cursor-pointer"
        >
          <FolderPlus className="h-4 w-4" />
          <span>New Folder</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-start gap-2.5">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-start gap-2.5">
          <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{success}</span>
        </div>
      )}

      {/* Folders List */}
      {folders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/30 p-12 text-center">
          <div className="h-12 w-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto mb-3">
            <FolderTree className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-slate-100">No folders created yet</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Create folders to categorize architecture specs, meeting notes, guides, and docs.
          </p>
          <button
            onClick={() => {
              setParentFolderForNew(null);
              setIsModalOpen(true);
            }}
            className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-all shadow-md"
          >
            <FolderPlus className="h-4 w-4" />
            <span>Create First Folder</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {folders.map((folder) => (
            <div
              key={folder.id}
              className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex flex-col justify-between shadow-lg shadow-slate-950/40 hover:border-slate-700 transition-all"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 p-0.5 flex items-center justify-center">
                    <div className="h-full w-full bg-slate-950 rounded-[9px] flex items-center justify-center">
                      <Folder className="h-5 w-5 text-cyan-400" />
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteFolder(folder.id, folder.name)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    title="Delete Folder"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <h3 className="text-base font-bold text-slate-100 truncate">{folder.name}</h3>

                {folder.parent && (
                  <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                    <span>Inside:</span>
                    <span className="font-semibold text-slate-300">{folder.parent.name}</span>
                  </p>
                )}
              </div>

              <div className="mt-6 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <FileText className="h-3.5 w-3.5 text-slate-500" />
                    <span>{folder._count.documents} docs</span>
                  </span>
                  {folder._count.children > 0 && (
                    <span className="flex items-center gap-1">
                      <FolderTree className="h-3.5 w-3.5 text-slate-500" />
                      <span>{folder._count.children} subfolders</span>
                    </span>
                  )}
                </div>

                <Link
                  href={`/workspaces/${workspaceId}/documents?folderId=${folder.id}`}
                  className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
                >
                  <span>Open</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      <CreateFolderModal
        workspaceId={workspaceId}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        availableFolders={folders}
        defaultParentId={parentFolderForNew}
        onSuccess={() => {
          reloadFolders();
        }}
      />
    </main>
  );
}
