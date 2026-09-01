"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { useWorkspace, type WorkspaceItem } from "@/hooks/use-workspace";
import { CreateWorkspaceModal } from "@/components/workspaces/create-workspace-modal";
import {
  LogOut,
  Sparkles,
  Building2,
  BookOpen,
  ShieldCheck,
  ArrowRight,
  Loader2,
  Plus,
  Users,
  FileText,
  Shield,
  User,
} from "lucide-react";
import { Role } from "@prisma/client";

export default function DashboardPage() {
  const { user, isLoading: isAuthLoading, logout } = useAuth();
  const { workspaces, isLoading: isWorkspacesLoading } = useWorkspace();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const getRoleBadge = (role: Role) => {
    switch (role) {
      case Role.OWNER:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <Sparkles className="h-2.5 w-2.5" />
            Owner
          </span>
        );
      case Role.ADMIN:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Shield className="h-2.5 w-2.5" />
            Admin
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-500/10 border border-slate-500/30 text-slate-400">
            <User className="h-2.5 w-2.5" />
            Member
          </span>
        );
    }
  };

  if (isAuthLoading || isWorkspacesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
          <p className="text-sm">Loading workspace session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Navigation */}
      <header className="border-b border-slate-800/80 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-tr from-indigo-500 to-cyan-400 p-0.5 shadow-md shadow-indigo-500/20 flex items-center justify-center">
              <div className="h-full w-full bg-slate-950 rounded-[7px] flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-indigo-400" />
              </div>
            </div>
            <span className="font-bold text-slate-100 tracking-tight text-lg">
              AI Knowledge Workspace
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 px-3 py-1.5 rounded-full bg-slate-800/60 border border-slate-700/60 text-xs text-slate-300">
              <div className="h-6 w-6 rounded-full bg-indigo-600 flex items-center justify-center text-white font-medium">
                {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
              </div>
              <span className="font-medium hidden sm:inline">{user?.name || user?.email}</span>
            </div>

            <button
              onClick={() => logout()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium transition-colors cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-100 tracking-tight">
              Welcome back, {user?.name || "Workspace Member"}
            </h1>
            <p className="text-slate-400 mt-1.5 text-sm max-w-2xl">
              Access your team workspaces, documents, and AI collaborative knowledge bases.
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-medium text-xs shadow-lg shadow-indigo-600/25 transition-all self-start sm:self-auto cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>New Workspace</span>
          </button>
        </div>

        {/* Workspaces Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Building2 className="h-5 w-5 text-indigo-400" />
              <span>Your Workspaces ({workspaces.length})</span>
            </h2>
            <Link
              href="/workspaces"
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {workspaces.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/30 p-10 text-center">
              <div className="h-12 w-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto mb-3">
                <Building2 className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-slate-100">No workspaces yet</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Create a workspace to organize your knowledge, documents, folders, and team members.
              </p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-all shadow-md cursor-pointer"
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

                    <h3 className="text-base font-bold text-slate-100 group-hover:text-indigo-300 transition-colors">
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
                    </div>

                    <span className="inline-flex items-center gap-1 text-indigo-400 font-medium group-hover:translate-x-0.5 transition-transform">
                      <span>Open</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* System Architecture Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800">
            <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="text-base font-semibold text-slate-100">Role-Based Authorization</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Granular server-side permissions: OWNER (full deletion &amp; administration), ADMIN
              (document and member controls), MEMBER (workspace access).
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800">
            <div className="h-10 w-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-4">
              <Building2 className="h-5 w-5" />
            </div>
            <h3 className="text-base font-semibold text-slate-100">Multi-Tenancy Isolation</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Every document, folder, and activity audit entry is strictly bound to its workspace
              tenant and validated on every query.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800">
            <div className="h-10 w-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 mb-4">
              <BookOpen className="h-5 w-5" />
            </div>
            <h3 className="text-base font-semibold text-slate-100">Document Intelligence</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Ready for Phase 6-11: Member management, rich document editing, folder hierarchies,
              version histories, and AI assistant summarization.
            </p>
          </div>
        </div>
      </main>

      <CreateWorkspaceModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
