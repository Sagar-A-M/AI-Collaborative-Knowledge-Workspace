"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  History,
  RotateCcw,
  Clock,
  User,
  CheckCircle2,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { formatDate, formatRelativeTime } from "@/lib/utils";
import type { ApiResponse } from "@/types/api";

interface VersionItem {
  id: string;
  versionNumber: number;
  title: string;
  content: string;
  changeSummary: string | null;
  createdAt: string;
  createdBy: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
  wordCount: number;
  charCount: number;
}

interface DocumentVersionHistoryDrawerProps {
  workspaceId: string;
  documentId: string;
  isOpen: boolean;
  onClose: () => void;
  onRestore: (restoredDoc: { title: string; content: string; versionsCount: number }) => void;
}

export function DocumentVersionHistoryDrawer({
  workspaceId,
  documentId,
  isOpen,
  onClose,
  onRestore,
}: DocumentVersionHistoryDrawerProps) {
  const [versions, setVersions] = useState<VersionItem[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<VersionItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRestoring, setIsRestoring] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;

    async function loadVersions() {
      setIsLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/workspaces/${workspaceId}/documents/${documentId}/versions`);
        const data: ApiResponse<{ versions: VersionItem[] }> = await res.json();

        if (isMounted) {
          if (data.success) {
            setVersions(data.data.versions);
            if (data.data.versions.length > 0) {
              setSelectedVersion(data.data.versions[0]);
            }
          } else {
            setError(data.error.message);
          }
        }
      } catch {
        if (isMounted) {
          setError("Failed to load version history");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadVersions();

    return () => {
      isMounted = false;
    };
  }, [workspaceId, documentId, isOpen]);

  if (!isOpen) return null;

  const handleRestore = async (version: VersionItem) => {
    if (
      !confirm(
        `Are you sure you want to restore Version #${version.versionNumber}? This will update the live document and create a new version snapshot.`
      )
    ) {
      return;
    }

    setError(null);
    setSuccess(null);
    setIsRestoring(true);

    try {
      const res = await fetch(
        `/api/workspaces/${workspaceId}/documents/${documentId}/versions/${version.id}/restore`,
        { method: "POST" }
      );

      const data: ApiResponse<{
        document: { title: string; content: string };
        currentVersionNumber: number;
      }> = await res.json();

      if (!data.success) {
        setError(data.error.message);
        setIsRestoring(false);
        return;
      }

      setSuccess(`Document restored to Version #${version.versionNumber}!`);
      onRestore({
        title: data.data.document.title,
        content: data.data.document.content,
        versionsCount: data.data.currentVersionNumber,
      });

      setTimeout(() => {
        onClose();
      }, 1000);
    } catch {
      setError("Failed to restore document version");
      setIsRestoring(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl h-full bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        {/* Drawer Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-500 p-0.5 flex items-center justify-center">
              <div className="h-full w-full bg-slate-950 rounded-[9px] flex items-center justify-center">
                <History className="h-5 w-5 text-indigo-400" />
              </div>
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">Document Version History</h2>
              <p className="text-xs text-slate-400">
                View previous revisions and restore snapshots
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="m-6 mb-0 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-start gap-2.5">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="m-6 mb-0 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-start gap-2.5">
            <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{success}</span>
          </div>
        )}

        {/* Drawer Content */}
        <div className="flex-1 flex flex-col md:flex-row min-h-0 divide-y md:divide-y-0 md:divide-x divide-slate-800">
          {/* Left Column: Versions Timeline */}
          <div className="w-full md:w-5/12 overflow-y-auto p-4 space-y-2.5">
            <div className="px-2 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Snapshots ({versions.length})
            </div>

            {isLoading ? (
              <div className="p-8 flex items-center justify-center text-slate-400">
                <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
              </div>
            ) : versions.length === 0 ? (
              <p className="text-xs text-slate-500 p-4">No previous versions found.</p>
            ) : (
              versions.map((ver, index) => {
                const isSelected = selectedVersion?.id === ver.id;
                const isLatest = index === 0;

                return (
                  <button
                    key={ver.id}
                    onClick={() => setSelectedVersion(ver)}
                    className={`w-full p-3 rounded-xl text-left border transition-all ${
                      isSelected
                        ? "bg-indigo-600/20 border-indigo-500/50 text-slate-100 shadow-md"
                        : "bg-slate-950/60 border-slate-800/80 hover:bg-slate-800/50 text-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                        v{ver.versionNumber} {isLatest && "(Current)"}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {formatRelativeTime(ver.createdAt)}
                      </span>
                    </div>

                    <div className="text-xs font-medium text-slate-200 truncate">
                      {ver.changeSummary || "Snapshot"}
                    </div>

                    <div className="mt-2 text-[10px] text-slate-400 flex items-center gap-2">
                      <span className="flex items-center gap-1 truncate">
                        <User className="h-3 w-3 text-slate-500" />
                        {ver.createdBy.name || ver.createdBy.email}
                      </span>
                      <span>•</span>
                      <span>{ver.wordCount} words</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Right Column: Selected Version Snapshot Preview */}
          <div className="flex-1 overflow-y-auto p-6 flex flex-col justify-between">
            {selectedVersion ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-xs font-bold bg-indigo-500/20 text-indigo-300">
                        Version {selectedVersion.versionNumber} Preview
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5">
                      <Clock className="h-3 w-3" />
                      <span>{formatDate(selectedVersion.createdAt)}</span>
                      <span>
                        by {selectedVersion.createdBy.name || selectedVersion.createdBy.email}
                      </span>
                    </p>
                  </div>

                  <button
                    onClick={() => handleRestore(selectedVersion)}
                    disabled={isRestoring}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-all shadow-md cursor-pointer disabled:opacity-50"
                  >
                    {isRestoring ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Restoring...</span>
                      </>
                    ) : (
                      <>
                        <RotateCcw className="h-3.5 w-3.5" />
                        <span>Restore This</span>
                      </>
                    )}
                  </button>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-slate-100 mb-3">{selectedVersion.title}</h3>
                  <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-300 font-mono text-xs whitespace-pre-wrap leading-relaxed max-h-[350px] overflow-y-auto">
                    {selectedVersion.content || "(Empty snapshot)"}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500 text-xs">
                Select a version from the timeline to preview its snapshot.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
