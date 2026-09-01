"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Search,
  FileText,
  Folder,
  Clock,
  History,
  ArrowRight,
  Loader2,
  X,
  Sparkles,
} from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";
import type { ApiResponse } from "@/types/api";

interface SearchResult {
  id: string;
  title: string;
  snippet: string;
  folder?: {
    id: string;
    name: string;
  } | null;
  author: {
    id: string;
    name: string | null;
    email: string;
  };
  versionsCount: number;
  updatedAt: string;
  matchType: "title" | "content" | "both";
}

interface FolderOption {
  id: string;
  name: string;
}

export default function WorkspaceSearchPage() {
  const params = useParams();
  const workspaceId = params?.workspaceId as string;

  const [query, setQuery] = useState("");
  const [selectedFolderId, setSelectedFolderId] = useState("all");
  const [folders, setFolders] = useState<FolderOption[]>([]);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Load available folders for filtering
  useEffect(() => {
    let isMounted = true;

    async function loadFolders() {
      try {
        const res = await fetch(`/api/workspaces/${workspaceId}/folders`);
        const data: ApiResponse<{ folders: FolderOption[] }> = await res.json();
        if (isMounted && data.success) {
          setFolders(data.data.folders);
        }
      } catch (err) {
        console.error("Failed to load folders for search filter:", err);
      }
    }

    loadFolders();

    return () => {
      isMounted = false;
    };
  }, [workspaceId]);

  const performSearch = useCallback(
    async (searchQuery: string, folderId: string) => {
      if (!searchQuery.trim()) {
        setResults([]);
        setHasSearched(false);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setHasSearched(true);

      try {
        const folderParam = folderId !== "all" ? `&folderId=${folderId}` : "";
        const res = await fetch(
          `/api/workspaces/${workspaceId}/search?q=${encodeURIComponent(
            searchQuery.trim()
          )}${folderParam}`
        );
        const data: ApiResponse<{ results: SearchResult[] }> = await res.json();

        if (data.success) {
          setResults(data.data.results);
        }
      } catch (err) {
        console.error("Search failed:", err);
      } finally {
        setIsLoading(false);
      }
    },
    [workspaceId]
  );

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(query, selectedFolderId);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, selectedFolderId, performSearch]);

  const highlightMatches = (text: string, searchTerm: string) => {
    if (!searchTerm.trim() || !text) return text;

    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
    const parts = text.split(regex);

    return parts.map((part, index) =>
      part.toLowerCase() === searchTerm.toLowerCase() ? (
        <span key={index} className="bg-indigo-500/30 text-indigo-200 font-semibold px-0.5 rounded">
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  return (
    <main className="p-8 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2.5">
          <Search className="h-6 w-6 text-indigo-400" />
          <span>Workspace Search</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Search document titles, text bodies, and knowledge specs in this workspace
        </p>
      </div>

      {/* Search Input Box & Controls */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="h-5 w-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type keywords, titles, or concepts to search..."
            className="w-full pl-12 pr-12 py-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/60 shadow-xl transition-all"
            autoFocus
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Folder filter options */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mr-1">
            Filter:
          </span>
          <button
            onClick={() => setSelectedFolderId("all")}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all shrink-0 ${
              selectedFolderId === "all"
                ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/40"
                : "bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800"
            }`}
          >
            All Folders
          </button>

          <button
            onClick={() => setSelectedFolderId("root")}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all shrink-0 ${
              selectedFolderId === "root"
                ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/40"
                : "bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800"
            }`}
          >
            Root Only
          </button>

          {folders.map((f) => (
            <button
              key={f.id}
              onClick={() => setSelectedFolderId(f.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all shrink-0 ${
                selectedFolderId === f.id
                  ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/40"
                  : "bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800"
              }`}
            >
              <Folder className="h-3 w-3 text-cyan-400" />
              <span>{f.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Results Container */}
      <div className="space-y-4">
        {isLoading && (
          <div className="p-12 flex items-center justify-center text-slate-400">
            <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
          </div>
        )}

        {!isLoading && !hasSearched && (
          <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/30 p-12 text-center">
            <div className="h-12 w-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto mb-3">
              <Sparkles className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-slate-100">Search Workspace Documents</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Find notes, specs, guidelines, and architecture decisions across all folders.
            </p>
          </div>
        )}

        {!isLoading && hasSearched && results.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/30 p-12 text-center">
            <div className="h-12 w-12 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <Search className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-slate-100">No matching documents found</h3>
            <p className="text-xs text-slate-400 mt-1">
              Try searching with different keywords or clearing the folder filter.
            </p>
          </div>
        )}

        {!isLoading && hasSearched && results.length > 0 && (
          <div className="space-y-3">
            <div className="text-xs text-slate-400 px-1">
              Found <span className="font-semibold text-slate-200">{results.length}</span>{" "}
              {results.length === 1 ? "document" : "documents"} matching &quot;{query}&quot;
            </div>

            <div className="space-y-3">
              {results.map((doc) => (
                <Link
                  key={doc.id}
                  href={`/workspaces/${workspaceId}/documents/${doc.id}`}
                  className="block p-5 rounded-2xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 hover:border-indigo-500/40 transition-all shadow-md group"
                >
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="h-7 w-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                        <FileText className="h-3.5 w-3.5" />
                      </div>
                      <h3 className="text-sm font-bold text-slate-100 group-hover:text-indigo-300 transition-colors truncate">
                        {highlightMatches(doc.title, query)}
                      </h3>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {doc.matchType === "both" && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                          Title &amp; Body match
                        </span>
                      )}
                      {doc.matchType === "title" && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                          Title match
                        </span>
                      )}
                      {doc.matchType === "content" && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
                          Body match
                        </span>
                      )}
                    </div>
                  </div>

                  {doc.snippet && (
                    <p className="text-xs text-slate-400 pl-9 line-clamp-2 leading-relaxed font-mono">
                      {highlightMatches(doc.snippet, query)}
                    </p>
                  )}

                  <div className="mt-4 pt-3 pl-9 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-500">
                    <div className="flex items-center gap-3">
                      {doc.folder && (
                        <span className="inline-flex items-center gap-1 text-slate-400">
                          <Folder className="h-3 w-3 text-cyan-400" />
                          <span>{doc.folder.name}</span>
                        </span>
                      )}
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatRelativeTime(doc.updatedAt)}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <History className="h-3 w-3" />v{doc.versionsCount || 1}
                      </span>
                    </div>

                    <span className="text-indigo-400 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                      <span>Open</span>
                      <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
