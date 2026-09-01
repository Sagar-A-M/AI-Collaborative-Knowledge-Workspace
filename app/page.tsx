"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import {
  Sparkles,
  ArrowRight,
  Layers,
  FileText,
  Search,
  History,
  FolderTree,
  Bot,
  Zap,
} from "lucide-react";

export default function HomePage() {
  const { user, isLoading } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white relative overflow-hidden">
      {/* Background Gradients & Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-indigo-600/20 via-cyan-500/10 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute top-96 right-0 w-96 h-96 bg-purple-600/10 blur-3xl pointer-events-none" />

      {/* Navigation Header */}
      <header className="border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-400 p-0.5 shadow-md shadow-indigo-500/20 flex items-center justify-center">
              <div className="h-full w-full bg-slate-950 rounded-[9px] flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-indigo-400" />
              </div>
            </div>
            <span className="font-bold text-slate-100 tracking-tight text-base sm:text-lg">
              AI Knowledge Workspace
            </span>
          </div>

          <div className="flex items-center gap-4">
            {!isLoading && user ? (
              <Link
                href="/workspaces"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-medium text-xs sm:text-sm transition-all shadow-lg shadow-indigo-600/25 cursor-pointer"
              >
                <span>Go to Workspaces</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-4 py-2 rounded-xl text-slate-300 hover:text-white text-xs sm:text-sm font-medium transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-medium text-xs sm:text-sm transition-all shadow-lg shadow-indigo-600/25"
                >
                  <span>Get Started</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-8">
          <Zap className="h-3.5 w-3.5" />
          <span>Production-Ready Multi-Tenant SaaS</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-slate-100 tracking-tight max-w-5xl leading-[1.15]">
          Collaborative Knowledge Base Powered by{" "}
          <span className="bg-gradient-to-r from-indigo-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            AI Intelligence
          </span>
        </h1>

        <p className="mt-6 text-base sm:text-lg text-slate-400 max-w-2xl leading-relaxed">
          Centralize team documentation, hierarchical folders, version histories, and natural
          language Q&amp;A with enterprise multi-tenancy and Redis-accelerated performance.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <Link
            href="/register"
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-semibold text-sm shadow-xl shadow-indigo-600/30 transition-all flex items-center justify-center gap-2"
          >
            <span>Create Workspace Free</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-semibold text-sm transition-all flex items-center justify-center gap-2"
          >
            <span>Sign In to Existing Space</span>
          </Link>
        </div>

        {/* Product UI Preview Card */}
        <div className="mt-16 w-full max-w-5xl rounded-3xl bg-slate-900/60 border border-slate-800 shadow-2xl p-4 sm:p-6 text-left relative backdrop-blur-xl">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-rose-500/80" />
              <span className="h-3 w-3 rounded-full bg-amber-500/80" />
              <span className="h-3 w-3 rounded-full bg-emerald-500/80" />
              <span className="ml-2 text-xs font-mono text-slate-400">
                workspace.app / engineering-specs
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-indigo-400 font-medium">
              <Sparkles className="h-3.5 w-3.5" />
              <span>AI Assistant Active</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-2">
              <div className="flex items-center gap-2 text-indigo-400">
                <FileText className="h-4 w-4" />
                <span className="text-xs font-bold">Document Editor</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Markdown toolbar, debounced auto-save, live preview, and snapshot revision tracking.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-2">
              <div className="flex items-center gap-2 text-cyan-400">
                <Search className="h-4 w-4" />
                <span className="text-xs font-bold">PostgreSQL Search</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Sub-millisecond keyword search across titles and document content with Redis query
                caching.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-2">
              <div className="flex items-center gap-2 text-emerald-400">
                <Bot className="h-4 w-4" />
                <span className="text-xs font-bold">AI Knowledge Grounding</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Instant question answers, document summaries, and workspace digests with source
                citations.
              </p>
            </div>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 text-left w-full">
          <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80 backdrop-blur-sm space-y-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Layers className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-slate-100">Multi-Tenant Isolation</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Isolated workspace boundaries, granular role permissions (Owner, Admin, Member), and
              cryptographic invitation tokens.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80 backdrop-blur-sm space-y-3">
            <div className="h-10 w-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <FolderTree className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-slate-100">Nested Hierarchy &amp; Folders</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Organize knowledge specs into multi-level directory structures and seamlessly move
              documents between folders.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80 backdrop-blur-sm space-y-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <History className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-slate-100">Version Revisions &amp; Restores</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Automatic version snapshots, change notes, diff previews, and 1-click historical
              restoration.
            </p>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-24 pt-8 border-t border-slate-800/80 w-full flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            © {new Date().getFullYear()} AI Collaborative Knowledge Workspace. Production SaaS.
          </div>
          <div className="flex items-center gap-6">
            <Link href="/login" className="hover:text-slate-300 transition-colors">
              Sign In
            </Link>
            <Link href="/register" className="hover:text-slate-300 transition-colors">
              Get Started
            </Link>
            <span className="text-slate-700">|</span>
            <span className="font-mono text-[11px] text-slate-400">Press Cmd+K for Search</span>
          </div>
        </footer>
      </main>
    </div>
  );
}
