"use client";

import React, { useState, useEffect } from "react";
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
  Clock,
  User,
  History,
  Loader2,
} from "lucide-react";
import { Role, ActivityType } from "@prisma/client";
import { formatRelativeTime } from "@/lib/utils";
import type { ApiResponse } from "@/types/api";

interface RecentDoc {
  id: string;
  title: string;
  content: string;
  folder?: { name: string } | null;
  updatedAt: string;
  versionsCount: number;
}

interface RecentActivity {
  id: string;
  type: ActivityType;
  description: string;
  createdAt: string;
  user: {
    name: string | null;
    email: string;
  };
}

export default function WorkspaceDashboardPage() {
  const params = useParams();
  const workspaceId = params?.workspaceId as string;
  const { activeWorkspace } = useWorkspace();

  const [recentDocs, setRecentDocs] = useState<RecentDoc[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const isOwner = activeWorkspace?.role === Role.OWNER;
  const isAdmin = activeWorkspace?.role === Role.ADMIN || isOwner;

  useEffect(() => {
    let isMounted = true;

    async function loadDashboardData() {
      try {
        const [docsRes, actRes] = await Promise.all([
          fetch(`/api/workspaces/${workspaceId}/documents?recent=true`),
          fetch(`/api/workspaces/${workspaceId}/activity?limit=5`),
        ]);

        const docsData: ApiResponse<{ documents: RecentDoc[] }> = await docsRes.json();
        const actData: ApiResponse<{ activities: RecentActivity[] }> = await actRes.json();

        if (isMounted) {
          if (docsData.success) {
            setRecentDocs(docsData.data.documents);
          }
          if (actData.success) {
            setRecentActivities(actData.data.activities);
          }
        }
      } catch (error) {
        console.error("Failed to load dashboard data:", error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadDashboardData();

    return () => {
      isMounted = false;
    };
  }, [workspaceId]);

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

      {/* Two Column Grid: Recent Documents + Live Activity Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Documents */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-indigo-400" />
              <h2 className="text-sm font-bold text-slate-100">Recent Documents</h2>
            </div>
            <Link
              href={`/workspaces/${workspaceId}/documents`}
              className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {isLoading ? (
            <div className="p-8 flex items-center justify-center text-slate-400">
              <Loader2 className="h-5 w-5 animate-spin text-indigo-500" />
            </div>
          ) : recentDocs.length === 0 ? (
            <p className="text-xs text-slate-500 py-4 text-center">
              No documents in this workspace yet.
            </p>
          ) : (
            <div className="space-y-2.5">
              {recentDocs.map((doc) => (
                <Link
                  key={doc.id}
                  href={`/workspaces/${workspaceId}/documents/${doc.id}`}
                  className="p-3.5 rounded-xl bg-slate-950/60 hover:bg-slate-800/60 border border-slate-800/60 transition-colors flex items-center justify-between gap-3 group"
                >
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-slate-200 group-hover:text-indigo-300 transition-colors truncate">
                      {doc.title}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-2">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatRelativeTime(doc.updatedAt)}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <History className="h-3 w-3" />v{doc.versionsCount || 1}
                      </span>
                    </div>
                  </div>

                  <ArrowRight className="h-3.5 w-3.5 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all shrink-0" />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Live Activity Stream */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ActivityIcon className="h-4 w-4 text-emerald-400" />
              <h2 className="text-sm font-bold text-slate-100">Latest Activity</h2>
            </div>
            <Link
              href={`/workspaces/${workspaceId}/activity`}
              className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1"
            >
              <span>Full Audit Trail</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {isLoading ? (
            <div className="p-8 flex items-center justify-center text-slate-400">
              <Loader2 className="h-5 w-5 animate-spin text-emerald-500" />
            </div>
          ) : recentActivities.length === 0 ? (
            <p className="text-xs text-slate-500 py-4 text-center">No recent activity.</p>
          ) : (
            <div className="space-y-2.5">
              {recentActivities.map((act) => (
                <div
                  key={act.id}
                  className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/60 space-y-1"
                >
                  <p className="text-xs font-medium text-slate-200">{act.description}</p>
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {act.user.name || act.user.email}
                    </span>
                    <span>{formatRelativeTime(act.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
