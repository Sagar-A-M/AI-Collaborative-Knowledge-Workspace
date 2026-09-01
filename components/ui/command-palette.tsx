"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWorkspace } from "@/hooks/use-workspace";
import {
  Search,
  FileText,
  FolderTree,
  Users,
  Activity,
  Sparkles,
  Settings,
  LayoutDashboard,
  X,
  ArrowRight,
} from "lucide-react";

export function CommandPalette() {
  const router = useRouter();
  const { activeWorkspace } = useWorkspace();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");

  const workspaceId = activeWorkspace?.id;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  if (!isOpen || !workspaceId) return null;

  const defaultNavigationItems = [
    {
      title: "Workspace Dashboard",
      href: `/workspaces/${workspaceId}`,
      icon: LayoutDashboard,
      category: "Navigation",
    },
    {
      title: "Documents Explorer",
      href: `/workspaces/${workspaceId}/documents`,
      icon: FileText,
      category: "Navigation",
    },
    {
      title: "Folder Hierarchy",
      href: `/workspaces/${workspaceId}/folders`,
      icon: FolderTree,
      category: "Navigation",
    },
    {
      title: "Members & Permissions",
      href: `/workspaces/${workspaceId}/members`,
      icon: Users,
      category: "Navigation",
    },
    {
      title: "Activity Audit Trail",
      href: `/workspaces/${workspaceId}/activity`,
      icon: Activity,
      category: "Navigation",
    },
    {
      title: "Full-text Document Search",
      href: `/workspaces/${workspaceId}/search`,
      icon: Search,
      category: "Navigation",
    },
    {
      title: "AI Knowledge Assistant",
      href: `/workspaces/${workspaceId}/ai`,
      icon: Sparkles,
      category: "AI Tools",
    },
    {
      title: "Workspace Settings",
      href: `/workspaces/${workspaceId}/settings`,
      icon: Settings,
      category: "Navigation",
    },
  ];

  const filteredItems = defaultNavigationItems.filter((item) =>
    item.title.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (href: string) => {
    setIsOpen(false);
    setQuery("");
    router.push(href);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Input Bar */}
        <div className="p-4 border-b border-slate-800 flex items-center gap-3">
          <Search className="h-5 w-5 text-slate-400 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or search workspace..."
            className="w-full bg-transparent text-slate-100 placeholder-slate-500 text-sm focus:outline-none"
            autoFocus
          />
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="p-2 max-h-80 overflow-y-auto space-y-1">
          {filteredItems.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              No matching pages or tools found.
            </div>
          ) : (
            filteredItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.href}
                  onClick={() => handleSelect(item.href)}
                  className="w-full p-3 rounded-xl flex items-center justify-between hover:bg-slate-800 text-slate-200 hover:text-white transition-all text-xs group"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-7 w-7 rounded-lg bg-slate-800/80 group-hover:bg-indigo-600/20 text-slate-400 group-hover:text-indigo-400 flex items-center justify-center transition-colors">
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <span className="font-medium">{item.title}</span>
                  </div>

                  <ArrowRight className="h-3.5 w-3.5 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 bg-slate-950/60 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-500">
          <span>Navigate with mouse or keyboard</span>
          <span>Press ESC to close</span>
        </div>
      </div>
    </div>
  );
}
