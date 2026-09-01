"use client";

import React, { useState, useEffect, use } from "react";
import { DocumentEditor } from "@/components/documents/document-editor";
import { Loader2, AlertCircle } from "lucide-react";
import type { ApiResponse } from "@/types/api";

interface DocumentDetail {
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

interface FolderOption {
  id: string;
  name: string;
}

export default function DocumentDetailPage({
  params,
}: {
  params: Promise<{ workspaceId: string; documentId: string }>;
}) {
  const { workspaceId, documentId } = use(params);

  const [document, setDocument] = useState<DocumentDetail | null>(null);
  const [folders, setFolders] = useState<FolderOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        const [docRes, foldersRes] = await Promise.all([
          fetch(`/api/workspaces/${workspaceId}/documents/${documentId}`),
          fetch(`/api/workspaces/${workspaceId}/folders`),
        ]);

        const docData: ApiResponse<{ document: DocumentDetail }> = await docRes.json();
        const foldersData: ApiResponse<{ folders: FolderOption[] }> = await foldersRes.json();

        if (isMounted) {
          if (docData.success) {
            setDocument(docData.data.document);
          } else {
            setError(docData.error.message);
          }

          if (foldersData.success) {
            setFolders(foldersData.data.folders);
          }
        }
      } catch {
        if (isMounted) {
          setError("Failed to load document");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [workspaceId, documentId]);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-950 text-slate-400">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-950 text-slate-100 p-4">
        <div className="max-w-md w-full p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-4">
          <div className="h-12 w-12 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto">
            <AlertCircle className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-bold">Document Not Found</h2>
          <p className="text-xs text-slate-400">
            {error || "This document does not exist or you do not have permission to view it."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <DocumentEditor
      key={document.id}
      workspaceId={workspaceId}
      documentId={documentId}
      initialDocument={document}
      availableFolders={folders}
    />
  );
}
