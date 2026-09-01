"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { ActivityType } from "@prisma/client";
import {
  Activity as ActivityIcon,
  FileText,
  UserPlus,
  UserMinus,
  Shield,
  FolderPlus,
  Trash2,
  Building2,
  RotateCcw,
  Clock,
  User,
  Loader2,
  Sparkles,
} from "lucide-react";
import { formatDate, formatRelativeTime } from "@/lib/utils";
import type { ApiResponse } from "@/types/api";

interface ActivityItem {
  id: string;
  type: ActivityType;
  description: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
}

export default function WorkspaceActivityPage() {
  const params = useParams();
  const workspaceId = params?.workspaceId as string;

  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [filterCategory, setFilterCategory] = useState<string>("ALL");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function initialize() {
      try {
        const res = await fetch(`/api/workspaces/${workspaceId}/activity`);
        const data: ApiResponse<{ activities: ActivityItem[] }> = await res.json();

        if (isMounted && data.success) {
          setActivities(data.data.activities);
        }
      } catch (error) {
        console.error("Failed to load activity logs:", error);
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

  const getActivityIcon = (type: ActivityType) => {
    switch (type) {
      case ActivityType.WORKSPACE_CREATED:
      case ActivityType.WORKSPACE_UPDATED:
        return {
          icon: Building2,
          color: "text-purple-400 bg-purple-500/10 border-purple-500/30",
        };
      case ActivityType.MEMBER_INVITED:
      case ActivityType.MEMBER_JOINED:
        return {
          icon: UserPlus,
          color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/30",
        };
      case ActivityType.MEMBER_REMOVED:
        return {
          icon: UserMinus,
          color: "text-rose-400 bg-rose-500/10 border-rose-500/30",
        };
      case ActivityType.MEMBER_ROLE_CHANGED:
        return {
          icon: Shield,
          color: "text-amber-400 bg-amber-500/10 border-amber-500/30",
        };
      case ActivityType.FOLDER_CREATED:
        return {
          icon: FolderPlus,
          color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
        };
      case ActivityType.FOLDER_DELETED:
        return {
          icon: Trash2,
          color: "text-rose-400 bg-rose-500/10 border-rose-500/30",
        };
      case ActivityType.DOCUMENT_CREATED:
        return {
          icon: FileText,
          color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/30",
        };
      case ActivityType.DOCUMENT_UPDATED:
        return {
          icon: FileText,
          color: "text-sky-400 bg-sky-500/10 border-sky-500/30",
        };
      case ActivityType.DOCUMENT_DELETED:
        return {
          icon: Trash2,
          color: "text-rose-400 bg-rose-500/10 border-rose-500/30",
        };
      case ActivityType.DOCUMENT_RESTORED:
        return {
          icon: RotateCcw,
          color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
        };
      default:
        return {
          icon: Sparkles,
          color: "text-slate-400 bg-slate-500/10 border-slate-500/30",
        };
    }
  };

  const filteredActivities = activities.filter((act) => {
    if (filterCategory === "ALL") return true;
    if (filterCategory === "DOCUMENTS") {
      return (
        act.type === ActivityType.DOCUMENT_CREATED ||
        act.type === ActivityType.DOCUMENT_UPDATED ||
        act.type === ActivityType.DOCUMENT_DELETED ||
        act.type === ActivityType.DOCUMENT_RESTORED
      );
    }
    if (filterCategory === "MEMBERS") {
      return (
        act.type === ActivityType.MEMBER_INVITED ||
        act.type === ActivityType.MEMBER_JOINED ||
        act.type === ActivityType.MEMBER_REMOVED ||
        act.type === ActivityType.MEMBER_ROLE_CHANGED
      );
    }
    if (filterCategory === "FOLDERS") {
      return act.type === ActivityType.FOLDER_CREATED || act.type === ActivityType.FOLDER_DELETED;
    }
    if (filterCategory === "WORKSPACE") {
      return (
        act.type === ActivityType.WORKSPACE_CREATED || act.type === ActivityType.WORKSPACE_UPDATED
      );
    }
    return true;
  });

  if (isLoading) {
    return (
      <div className="p-12 flex items-center justify-center text-slate-400">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <main className="p-8 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2.5">
          <ActivityIcon className="h-6 w-6 text-indigo-400" />
          <span>Workspace Activity Audit Trail</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Complete timeline of actions, document changes, and membership events in this workspace
        </p>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {["ALL", "DOCUMENTS", "MEMBERS", "FOLDERS", "WORKSPACE"].map((cat) => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 ${
              filterCategory === cat
                ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/40"
                : "bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800"
            }`}
          >
            {cat.charAt(0) + cat.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* Timeline List */}
      {filteredActivities.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/30 p-12 text-center">
          <div className="h-12 w-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto mb-3">
            <ActivityIcon className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-slate-100">No activity recorded yet</h3>
          <p className="text-xs text-slate-400 mt-1">
            Actions taken in this workspace will automatically appear here.
          </p>
        </div>
      ) : (
        <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800/80">
          {filteredActivities.map((act) => {
            const { icon: Icon, color } = getActivityIcon(act.type);

            return (
              <div key={act.id} className="relative flex items-start gap-4 group">
                {/* Node indicator */}
                <div
                  className={`-ml-6 h-6 w-6 rounded-full border flex items-center justify-center shrink-0 z-10 ${color}`}
                >
                  <Icon className="h-3 w-3" />
                </div>

                {/* Event Card */}
                <div className="flex-1 p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 group-hover:border-slate-700 transition-all shadow-md">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                    <p className="text-xs font-semibold text-slate-200">{act.description}</p>
                    <div className="flex items-center gap-1 text-[11px] text-slate-400 shrink-0">
                      <Clock className="h-3 w-3 text-slate-500" />
                      <span>{formatRelativeTime(act.createdAt)}</span>
                      <span>({formatDate(act.createdAt)})</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-800/60 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3 text-slate-500" />
                      <span>Actor: {act.user.name || act.user.email}</span>
                    </span>
                    <span>•</span>
                    <span className="font-mono text-[10px] text-indigo-400">
                      {act.type.replace(/_/g, " ")}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
