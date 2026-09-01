"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useWorkspace } from "@/hooks/use-workspace";
import {
  FileText,
  FolderTree,
  Users,
  Plus,
  ArrowRight,
  Sparkles,
  Settings,
  Shield,
  Activity as ActivityIcon,
} from "lucide-react";
import { Role } from "@prisma/client";

export default function WorkspaceDashboardPage() {
  const params = useParams();
  const workspaceId = params?.workspaceId as string;
  const { activeWorkspace } = useWorkspace();

  const isOwner = activeWorkspace?.role === Role.OWNER;
  const isAdmin = activeWorkspace?.role === Role.ADMIN || isOwner;

  return (
    <main className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header Banner */}
      <div className="p-8 rounded-3xl bg-gradient-to-r from-indigo-950/60 via-slate-900/80 to-slate-900 border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
                Workspace Hub
              </span>
              <span className="text-xs text-slate-400 font-mono">/{activeWorkspace?.slug}</span>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-100 tracking-tight">
              {activeWorkspace?.name || "Workspace Dashboard"}
            </h1>
            <p className="text-sm text-slate-400 mt-2 max-w-2xl leading-relaxed">
              {activeWorkspace?.description ||
                "Your centralized collaborative space for documents, nested folders, team members, and AI knowledge search."}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={`/workspaces/${workspaceId}/documents`}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-medium text-xs shadow-lg shadow-indigo-600/25 transition-all flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              <span>New Document</span>
            </Link>

            {isAdmin && (
              <Link
                href={`/workspaces/${workspaceId}/settings`}
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                title="Workspace Settings"
              >
                <Settings className="h-4 w-4" />
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-400">Documents</div>
            <div className="text-2xl font-bold text-slate-100 mt-1">
              {activeWorkspace?.stats?.documentsCount ?? 0}
            </div>
          </div>
          <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
            <FileText className="h-5 w-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-400">Folders</div>
            <div className="text-2xl font-bold text-slate-100 mt-1">
              {activeWorkspace?.stats?.foldersCount ?? 0}
            </div>
          </div>
          <div className="h-10 w-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
            <FolderTree className="h-5 w-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-400">Members</div>
            <div className="text-2xl font-bold text-slate-100 mt-1">
              {activeWorkspace?.stats?.membersCount ?? 1}
            </div>
          </div>
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <Users className="h-5 w-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-400">Your Role</div>
            <div className="text-base font-bold text-slate-100 mt-1 flex items-center gap-1.5">
              <Shield className="h-4 w-4 text-indigo-400" />
              <span>{activeWorkspace?.role || "MEMBER"}</span>
            </div>
          </div>
          <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
            <Sparkles className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Feature Modules Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          href={`/workspaces/${workspaceId}/documents`}
          className="p-6 rounded-2xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 hover:border-indigo-500/40 transition-all group"
        >
          <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-4">
            <FileText className="h-5 w-5" />
          </div>
          <h3 className="text-base font-bold text-slate-100 group-hover:text-indigo-300 transition-colors">
            Document Knowledge
          </h3>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            Create, edit, organize, and track document revisions in this workspace.
          </p>
          <div className="mt-4 flex items-center gap-1 text-xs text-indigo-400 font-medium group-hover:translate-x-1 transition-transform">
            <span>Explore Documents</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </div>
        </Link>

        <Link
          href={`/workspaces/${workspaceId}/members`}
          className="p-6 rounded-2xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 hover:border-cyan-500/40 transition-all group"
        >
          <div className="h-10 w-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mb-4">
            <Users className="h-5 w-5" />
          </div>
          <h3 className="text-base font-bold text-slate-100 group-hover:text-cyan-300 transition-colors">
            Team &amp; Roles
          </h3>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            Invite colleagues, assign Owner/Admin/Member roles, and manage permissions.
          </p>
          <div className="mt-4 flex items-center gap-1 text-xs text-cyan-400 font-medium group-hover:translate-x-1 transition-transform">
            <span>Manage Members</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </div>
        </Link>

        <Link
          href={`/workspaces/${workspaceId}/activity`}
          className="p-6 rounded-2xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 hover:border-emerald-500/40 transition-all group"
        >
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4">
            <ActivityIcon className="h-5 w-5" />
          </div>
          <h3 className="text-base font-bold text-slate-100 group-hover:text-emerald-300 transition-colors">
            Activity Audit Trail
          </h3>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            Inspect real-time timeline of workspace events, creations, updates, and role changes.
          </p>
          <div className="mt-4 flex items-center gap-1 text-xs text-emerald-400 font-medium group-hover:translate-x-1 transition-transform">
            <span>View Activity Log</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </div>
        </Link>
      </div>
    </main>
  );
}
