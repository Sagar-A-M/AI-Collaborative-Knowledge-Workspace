"use client";

import React, { useState } from "react";
import { X, FolderPlus, Loader2, AlertCircle, FolderTree } from "lucide-react";
import type { ApiResponse } from "@/types/api";

interface FolderOption {
  id: string;
  name: string;
}

interface CreateFolderModalProps {
  workspaceId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  availableFolders?: FolderOption[];
  defaultParentId?: string | null;
}

export function CreateFolderModal({
  workspaceId,
  isOpen,
  onClose,
  onSuccess,
  availableFolders = [],
  defaultParentId = null,
}: CreateFolderModalProps) {
  const [name, setName] = useState("");
  const [parentId, setParentId] = useState<string>(defaultParentId || "");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/folders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          parentId: parentId || null,
        }),
      });

      const data: ApiResponse<{ folder: { id: string } }> = await res.json();

      if (!data.success) {
        setError(data.error.message);
        setIsSubmitting(false);
        return;
      }

      setName("");
      setParentId("");
      onSuccess();
      onClose();
    } catch {
      setError("Failed to create folder. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 p-0.5 flex items-center justify-center">
            <div className="h-full w-full bg-slate-950 rounded-[9px] flex items-center justify-center">
              <FolderPlus className="h-5 w-5 text-cyan-400" />
            </div>
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-100">Create Folder</h2>
            <p className="text-xs text-slate-400">Organize documents into hierarchical folders</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-start gap-2.5">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Folder Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Engineering Specs"
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/60 text-sm"
            />
          </div>

          {availableFolders.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Parent Folder (Optional)
              </label>
              <div className="flex items-center rounded-xl bg-slate-950/80 border border-slate-800 px-3.5 py-2">
                <FolderTree className="h-4 w-4 text-slate-500 mr-2 shrink-0" />
                <select
                  value={parentId}
                  onChange={(e) => setParentId(e.target.value)}
                  className="w-full bg-transparent text-slate-200 text-sm focus:outline-none cursor-pointer"
                >
                  <option value="" className="bg-slate-900 text-slate-200">
                    None (Workspace Root)
                  </option>
                  {availableFolders.map((f) => (
                    <option key={f.id} value={f.id} className="bg-slate-900 text-slate-200">
                      {f.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800/80">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-medium text-xs shadow-lg shadow-cyan-600/30 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <FolderPlus className="h-3.5 w-3.5" />
                  <span>Create Folder</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
