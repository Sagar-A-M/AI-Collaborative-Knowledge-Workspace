"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { CreateDocumentModal } from "@/components/documents/create-document-modal";
import { CreateFolderModal } from "@/components/folders/create-folder-modal";
import {
  FileText,
  Plus,
  Search,
  Clock,
  History,
  FolderPlus,
  Loader2,
  Folder,
  ArrowRight,
} from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";
import type { ApiResponse } from "@/types/api";

interface DocumentItem {
  id: string;
  title: string;
  content: string;
  workspaceId: string;
  folderId: string | null;
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
  createdAt: string;
  updatedAt: string;
}

interface FolderItem {
  id: string;
  name: string;
  parentId: string | null;
  _count: {
    documents: number;
    children: number;
  };
}

export default function WorkspaceDocumentsPage() {
  const params = useParams();
  const workspaceId = params?.workspaceId as string;

  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);

  const reloadWorkspaceData = async () => {
    try {
      const [docsRes, foldersRes] = await Promise.all([
        fetch(`/api/workspaces/${workspaceId}/documents`),
        fetch(`/api/workspaces/${workspaceId}/folders`),
      ]);

      const docsData: ApiResponse<{ documents: DocumentItem[] }> = await docsRes.json();
      const foldersData: ApiResponse<{ folders: FolderItem[] }> = await foldersRes.json();

      if (docsData.success) {
        setDocuments(docsData.data.documents);
      }
      if (foldersData.success) {
        setFolders(foldersData.data.folders);
      }
    } catch (error) {
      console.error("Failed to load documents data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    async function initialize() {
      try {
        const [docsRes, foldersRes] = await Promise.all([
          fetch(`/api/workspaces/${workspaceId}/documents`),
          fetch(`/api/workspaces/${workspaceId}/folders`),
        ]);

        const docsData: ApiResponse<{ documents: DocumentItem[] }> = await docsRes.json();
        const foldersData: ApiResponse<{ folders: FolderItem[] }> = await foldersRes.json();

        if (isMounted) {
          if (docsData.success) {
            setDocuments(docsData.data.documents);
          }
          if (foldersData.success) {
            setFolders(foldersData.data.folders);
          }
        }
      } catch (error) {
        console.error("Failed to load documents data:", error);
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

  // Filter documents by folder and search query
  const filteredDocuments = documents.filter((doc) => {
    const matchesFolder =
      selectedFolderId === "all"
        ? true
        : selectedFolderId === "root"
          ? doc.folderId === null
          : doc.folderId === selectedFolderId;

    const matchesSearch =
      searchQuery.trim() === ""
        ? true
        : doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          doc.content.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFolder && matchesSearch;
  });

  if (isLoading) {
    return (
      <div className="p-12 flex items-center justify-center text-slate-400">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <main className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2.5">
            <FileText className="h-6 w-6 text-indigo-400" />
            <span>Workspace Knowledge &amp; Documents</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Browse, create, and organize team documentation and notes
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setIsFolderModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-medium transition-colors"
          >
            <FolderPlus className="h-3.5 w-3.5 text-cyan-400" />
            <span>New Folder</span>
          </button>

          <button
            onClick={() => setIsDocModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white text-xs font-medium shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>New Document</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Folder filter tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
          <button
            onClick={() => setSelectedFolderId("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 ${
              selectedFolderId === "all"
                ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/40"
                : "bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800"
            }`}
          >
            All Docs ({documents.length})
          </button>

          <button
            onClick={() => setSelectedFolderId("root")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 ${
              selectedFolderId === "root"
                ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/40"
                : "bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800"
            }`}
          >
            Root ({documents.filter((d) => !d.folderId).length})
          </button>

          {folders.map((folder) => (
            <button
              key={folder.id}
              onClick={() => setSelectedFolderId(folder.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 ${
                selectedFolderId === folder.id
                  ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/40"
                  : "bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800"
              }`}
            >
              <Folder className="h-3 w-3 text-cyan-400" />
              <span>{folder.name}</span>
              <span className="text-[10px] text-slate-500">({folder._count.documents})</span>
            </button>
          ))}
        </div>

        {/* Search input */}
        <div className="relative w-full md:w-64">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter documents..."
            className="w-full pl-9 pr-4 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-200 placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/60"
          />
        </div>
      </div>

      {/* Documents Grid */}
      {filteredDocuments.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/30 p-12 text-center">
          <div className="h-12 w-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto mb-3">
            <FileText className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-slate-100">No documents found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {searchQuery
              ? "No documents matched your search filter."
              : "Create your first knowledge document in this folder."}
          </p>
          <button
            onClick={() => setIsDocModalOpen(true)}
            className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-all shadow-md"
          >
            <Plus className="h-4 w-4" />
            <span>Create Document</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDocuments.map((doc) => (
            <Link
              key={doc.id}
              href={`/workspaces/${workspaceId}/documents/${doc.id}`}
              className="group p-5 rounded-2xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 hover:border-indigo-500/40 transition-all flex flex-col justify-between shadow-lg shadow-slate-950/40"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="h-8 w-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                    <FileText className="h-4 w-4" />
                  </div>

                  {doc.folder && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-300 border border-slate-700">
                      <Folder className="h-2.5 w-2.5 text-cyan-400" />
                      {doc.folder.name}
                    </span>
                  )}
                </div>

                <h3 className="text-base font-bold text-slate-100 group-hover:text-indigo-300 transition-colors line-clamp-1">
                  {doc.title}
                </h3>

                <p className="text-xs text-slate-400 mt-2 line-clamp-3 leading-relaxed">
                  {doc.content
                    ? doc.content.replace(/^#+\s+/gm, "").slice(0, 150)
                    : "Empty document..."}
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatRelativeTime(doc.updatedAt)}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <History className="h-3 w-3" />v{doc.versionsCount || 1}
                  </span>
                </div>

                <span className="text-indigo-400 group-hover:translate-x-1 transition-transform">
                  <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      <CreateDocumentModal
        workspaceId={workspaceId}
        isOpen={isDocModalOpen}
        onClose={() => setIsDocModalOpen(false)}
        availableFolders={folders}
        defaultFolderId={
          selectedFolderId !== "all" && selectedFolderId !== "root" ? selectedFolderId : null
        }
      />

      <CreateFolderModal
        workspaceId={workspaceId}
        isOpen={isFolderModalOpen}
        onClose={() => setIsFolderModalOpen(false)}
        availableFolders={folders}
        onSuccess={() => {
          reloadWorkspaceData();
        }}
      />
    </main>
  );
}
