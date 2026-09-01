"use client";

import React, { useState, useRef, useEffect } from "react";
import { useWorkspace, type WorkspaceItem } from "@/hooks/use-workspace";
import { ChevronDown, Plus, Check, Shield, User, Sparkles } from "lucide-react";
import { CreateWorkspaceModal } from "./create-workspace-modal";
import { Role } from "@prisma/client";

export function WorkspaceSwitcher() {
  const { workspaces, activeWorkspace, switchWorkspace } = useWorkspace();
  const [isOpen, setIsOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getRoleBadge = (role: Role) => {
    switch (role) {
      case Role.OWNER:
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <Sparkles className="h-2.5 w-2.5" />
            Owner
          </span>
        );
      case Role.ADMIN:
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Shield className="h-2.5 w-2.5" />
            Admin
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-500/10 border border-slate-500/30 text-slate-400">
            <User className="h-2.5 w-2.5" />
            Member
          </span>
        );
    }
  };

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between gap-2.5 p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800/90 border border-slate-800 hover:border-slate-700 transition-all text-left group"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-cyan-500 p-0.5 flex items-center justify-center shrink-0 shadow-sm shadow-indigo-500/20">
              <div className="h-full w-full bg-slate-950 rounded-[6px] flex items-center justify-center font-bold text-xs text-indigo-300">
                {activeWorkspace?.name?.charAt(0).toUpperCase() || "W"}
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-xs text-slate-100 truncate group-hover:text-indigo-300 transition-colors">
                {activeWorkspace?.name || "Select Workspace"}
              </div>
              <div className="text-[10px] text-slate-400 truncate">
                {activeWorkspace ? `app/${activeWorkspace.slug}` : "No workspace selected"}
              </div>
            </div>
          </div>
          <ChevronDown className="h-4 w-4 text-slate-400 group-hover:text-slate-200 transition-transform shrink-0" />
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-1.5 p-1.5 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl z-50 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
            <div className="px-2 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Your Workspaces ({workspaces.length})
            </div>

            <div className="max-h-60 overflow-y-auto space-y-1">
              {workspaces.map((ws: WorkspaceItem) => {
                const isSelected = activeWorkspace?.id === ws.id;
                return (
                  <button
                    key={ws.id}
                    onClick={() => {
                      switchWorkspace(ws.id);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between gap-2 p-2 rounded-lg text-left transition-colors ${
                      isSelected
                        ? "bg-indigo-600/20 border border-indigo-500/40 text-slate-100"
                        : "hover:bg-slate-800 text-slate-300 hover:text-slate-100"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="h-7 w-7 rounded-md bg-slate-800 flex items-center justify-center text-xs font-medium text-slate-200 shrink-0">
                        {ws.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-medium truncate">{ws.name}</div>
                        <div className="text-[10px] text-slate-400">/{ws.slug}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {getRoleBadge(ws.role)}
                      {isSelected && <Check className="h-4 w-4 text-indigo-400" />}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-1 pt-1 border-t border-slate-800">
              <button
                onClick={() => {
                  setIsOpen(false);
                  setIsModalOpen(true);
                }}
                className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-slate-800 text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Create Workspace</span>
              </button>
            </div>
          </div>
        )}
      </div>

      <CreateWorkspaceModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}
