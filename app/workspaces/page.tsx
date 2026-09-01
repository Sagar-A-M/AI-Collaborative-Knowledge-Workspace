"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useWorkspace, type WorkspaceItem } from "@/hooks/use-workspace";
import { CreateWorkspaceModal } from "@/components/workspaces/create-workspace-modal";
import {
  Building2,
  Plus,
  ArrowRight,
  Sparkles,
  Shield,
  User,
  Users,
  FileText,
  FolderTree,
  Loader2,
} from "lucide-react";
import { Role } from "@prisma/client";

export default function WorkspacesPage() {
  const { workspaces, isLoading } = useWorkspace();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const getRoleBadge = (role: Role) => {
    switch (role) {
      case Role.OWNER:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <Sparkles className="h-3 w-3" />
            Owner
          </span>
        );
      case Role.ADMIN:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Shield className="h-3 w-3" />
            Admin
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-500/10 border border-slate-500/30 text-slate-400">
            <User className="h-3 w-3" />
            Member
          </span>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
          <p className="text-sm">Loading your workspaces...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-100 tracking-tight">Workspaces</h1>
            <p className="text-sm text-slate-400 mt-1">
              Select an existing workspace or create a new one for your team
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-medium text-xs shadow-lg shadow-indigo-600/25 transition-all cursor-pointer self-start sm:self-auto"
          >
            <Plus className="h-4 w-4" />
            <span>Create Workspace</span>
          </button>
        </div>

        {workspaces.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/30 p-12 text-center max-w-md mx-auto my-12">
            <div className="h-12 w-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto mb-4">
              <Building2 className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-100">No workspaces yet</h3>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
              Create your first team workspace to start writing documents and collaborating with AI.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-all shadow-md"
            >
              <Plus className="h-4 w-4" />
              <span>Create Workspace</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {workspaces.map((ws: WorkspaceItem) => (
              <Link
                key={ws.id}
                href={`/workspaces/${ws.id}`}
                className="group p-6 rounded-2xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 hover:border-indigo-500/50 transition-all flex flex-col justify-between shadow-lg shadow-slate-950/40"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-500 p-0.5 flex items-center justify-center shadow-md shadow-indigo-500/20">
                      <div className="h-full w-full bg-slate-950 rounded-[9px] flex items-center justify-center font-bold text-sm text-indigo-300">
                        {ws.name.charAt(0).toUpperCase()}
                      </div>
                    </div>
                    {getRoleBadge(ws.role)}
                  </div>

                  <h3 className="text-lg font-bold text-slate-100 group-hover:text-indigo-300 transition-colors">
                    {ws.name}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">app/{ws.slug}</p>

                  {ws.description && (
                    <p className="text-xs text-slate-400 mt-2.5 line-clamp-2 leading-relaxed">
                      {ws.description}
                    </p>
                  )}
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5 text-slate-500" />
                      {ws.stats?.membersCount || 1}
                    </span>
                    <span className="flex items-center gap-1">
                      <FileText className="h-3.5 w-3.5 text-slate-500" />
                      {ws.stats?.documentsCount || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <FolderTree className="h-3.5 w-3.5 text-slate-500" />
                      {ws.stats?.foldersCount || 0}
                    </span>
                  </div>

                  <span className="inline-flex items-center gap-1 text-indigo-400 font-medium group-hover:translate-x-0.5 transition-transform">
                    <span>Enter</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      <CreateWorkspaceModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
