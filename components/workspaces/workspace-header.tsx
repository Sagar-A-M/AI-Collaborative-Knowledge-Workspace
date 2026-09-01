"use client";

import React from "react";
import Link from "next/link";
import { useWorkspace } from "@/hooks/use-workspace";
import { Sparkles, Bell, Search } from "lucide-react";

export function WorkspaceHeader() {
  const { activeWorkspace } = useWorkspace();
  const workspaceId = activeWorkspace?.id;

  return (
    <header className="h-16 border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center gap-3">
        <h2 className="text-base font-semibold text-slate-100">
          {activeWorkspace?.name || "Workspace"}
        </h2>
        {activeWorkspace && (
          <span className="text-xs text-slate-500 font-mono">/{activeWorkspace.slug}</span>
        )}
      </div>

      <div className="flex items-center gap-3">
        {workspaceId && (
          <Link
            href={`/workspaces/${workspaceId}/search`}
            className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800/80 border border-slate-800 text-slate-400 hover:text-slate-200 text-xs transition-colors"
          >
            <Search className="h-3.5 w-3.5" />
            <span>Search documents...</span>
            <kbd className="px-1.5 py-0.5 rounded text-[10px] bg-slate-950 text-slate-500 border border-slate-800 font-mono">
              /
            </kbd>
          </Link>
        )}

        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-medium">
          <Sparkles className="h-3.5 w-3.5" />
          <span>AI Engine Ready</span>
        </div>

        <button
          title="Notifications"
          className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent hover:border-slate-800 transition-colors"
        >
          <Bell className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
