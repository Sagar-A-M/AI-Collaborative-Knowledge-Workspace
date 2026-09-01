"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useWorkspace, type WorkspaceItem } from "@/hooks/use-workspace";
import {
  Settings,
  Building2,
  Trash2,
  Save,
  AlertTriangle,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { Role } from "@prisma/client";

function WorkspaceSettingsForm({
  workspace,
  onSave,
  onDelete,
}: {
  workspace: WorkspaceItem;
  onSave: (name: string, description: string) => Promise<{ success: boolean; error?: string }>;
  onDelete: () => Promise<void>;
}) {
  const [name, setName] = useState(workspace.name);
  const [description, setDescription] = useState(workspace.description || "");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isOwner = workspace.role === Role.OWNER;
  const isAdmin = workspace.role === Role.ADMIN || isOwner;

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSaving(true);

    const res = await onSave(name, description);
    setIsSaving(false);

    if (!res.success) {
      setError(res.error || "Failed to update workspace");
      return;
    }

    setSuccess("Workspace settings updated successfully");
  };

  const handleDelete = async () => {
    setError(null);
    setIsDeleting(true);
    await onDelete();
    setIsDeleting(false);
  };

  return (
    <div className="space-y-8">
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

      {/* General Information Form */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
        <h2 className="text-base font-bold text-slate-100 mb-4 flex items-center gap-2">
          <Building2 className="h-4 w-4 text-indigo-400" />
          <span>General Information</span>
        </h2>

        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Workspace Name
            </label>
            <input
              type="text"
              required
              disabled={!isAdmin || isSaving}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/60 text-sm disabled:opacity-60"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Workspace Slug
            </label>
            <input
              type="text"
              disabled
              value={workspace.slug}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950/40 border border-slate-800/60 text-slate-500 text-sm cursor-not-allowed font-mono"
            />
            <p className="text-[11px] text-slate-500 mt-1">Slug is permanent once created</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Description
            </label>
            <textarea
              rows={3}
              disabled={!isAdmin || isSaving}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Workspace description..."
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/60 text-sm resize-none disabled:opacity-60"
            />
          </div>

          {isAdmin && (
            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-all shadow-md shadow-indigo-600/30 flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-3.5 w-3.5" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          )}
        </form>
      </div>

      {/* Danger Zone (Owner Only) */}
      {isOwner && (
        <div className="p-6 rounded-2xl bg-red-950/20 border border-red-900/40">
          <h2 className="text-base font-bold text-red-400 mb-1 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            <span>Danger Zone</span>
          </h2>
          <p className="text-xs text-slate-400 mb-4">
            Deleting this workspace is permanent. All documents, folders, members, and activity
            history will be deleted immediately.
          </p>

          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-4 py-2 rounded-xl bg-red-600/20 hover:bg-red-600/30 border border-red-600/40 text-red-300 text-xs font-medium transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Delete Workspace</span>
            </button>
          ) : (
            <div className="p-4 rounded-xl bg-red-950/40 border border-red-800/60 space-y-3">
              <p className="text-xs text-red-200 font-semibold">
                Are you absolutely certain you want to permanently delete &quot;{workspace.name}
                &quot;?
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-medium transition-all shadow-md shadow-red-600/40 flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <span>Yes, delete workspace</span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function WorkspaceSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = params?.workspaceId as string;
  const { activeWorkspace, updateWorkspace, deleteWorkspace, isLoading } = useWorkspace();

  if (isLoading || !activeWorkspace) {
    return (
      <div className="p-8 flex items-center justify-center text-slate-400">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <main className="p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2.5">
          <Settings className="h-6 w-6 text-indigo-400" />
          <span>Workspace Settings</span>
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Manage general workspace configuration, metadata, and controls
        </p>
      </div>

      <WorkspaceSettingsForm
        key={activeWorkspace.id}
        workspace={activeWorkspace}
        onSave={async (name, description) => {
          return updateWorkspace(workspaceId, {
            name,
            description: description || null,
          });
        }}
        onDelete={async () => {
          const res = await deleteWorkspace(workspaceId);
          if (res.success) {
            router.push("/workspaces");
          }
        }}
      />
    </main>
  );
}
