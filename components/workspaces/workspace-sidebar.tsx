"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useWorkspace } from "@/hooks/use-workspace";
import { useAuth } from "@/hooks/use-auth";
import { WorkspaceSwitcher } from "./workspace-switcher";
import {
  LayoutDashboard,
  FileText,
  FolderTree,
  Users,
  Activity as ActivityIcon,
  Search,
  Settings,
  Sparkles,
  LogOut,
  Bot,
} from "lucide-react";

export function WorkspaceSidebar() {
  const pathname = usePathname();
  const { activeWorkspace } = useWorkspace();
  const { user, logout } = useAuth();

  const workspaceId = activeWorkspace?.id;

  const navItems = workspaceId
    ? [
        {
          label: "Dashboard",
          href: `/workspaces/${workspaceId}`,
          icon: LayoutDashboard,
          exact: true,
        },
        {
          label: "Documents",
          href: `/workspaces/${workspaceId}/documents`,
          icon: FileText,
        },
        {
          label: "Folders",
          href: `/workspaces/${workspaceId}/folders`,
          icon: FolderTree,
        },
        {
          label: "Members",
          href: `/workspaces/${workspaceId}/members`,
          icon: Users,
        },
        {
          label: "Activity",
          href: `/workspaces/${workspaceId}/activity`,
          icon: ActivityIcon,
        },
        {
          label: "Search",
          href: `/workspaces/${workspaceId}/search`,
          icon: Search,
        },
        {
          label: "AI Assistant",
          href: `/workspaces/${workspaceId}/ai`,
          icon: Bot,
        },
        {
          label: "Settings",
          href: `/workspaces/${workspaceId}/settings`,
          icon: Settings,
        },
      ]
    : [];

  return (
    <aside className="w-64 border-r border-slate-800/80 bg-slate-950 flex flex-col h-screen shrink-0 sticky top-0">
      {/* Brand & Workspace Switcher */}
      <div className="p-4 border-b border-slate-800/80 space-y-4">
        <div className="flex items-center gap-2.5 px-1">
          <div className="h-7 w-7 rounded-lg bg-gradient-to-tr from-indigo-500 to-cyan-400 p-0.5 shadow-md shadow-indigo-500/20 flex items-center justify-center">
            <div className="h-full w-full bg-slate-950 rounded-[5px] flex items-center justify-center">
              <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
            </div>
          </div>
          <span className="font-bold text-slate-100 text-sm tracking-tight">AI Knowledge Base</span>
        </div>

        <WorkspaceSwitcher />
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 py-1 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
          Workspace
        </div>

        {navItems.map((item) => {
          const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);

          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                isActive
                  ? "bg-indigo-600/15 text-indigo-300 border border-indigo-500/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
              }`}
            >
              <Icon
                className={`h-4 w-4 shrink-0 ${isActive ? "text-indigo-400" : "text-slate-400"}`}
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User profile footer */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/80">
        <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-900/60 border border-slate-800/60">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-7 w-7 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
              {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-medium text-slate-200 truncate">
                {user?.name || "User"}
              </div>
              <div className="text-[10px] text-slate-400 truncate">{user?.email}</div>
            </div>
          </div>

          <button
            onClick={() => logout()}
            title="Sign Out"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
