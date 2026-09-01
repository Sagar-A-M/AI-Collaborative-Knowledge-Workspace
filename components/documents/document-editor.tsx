"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Save,
  Trash2,
  FolderInput,
  Eye,
  Edit3,
  Clock,
  User,
  History,
  Sparkles,
  Loader2,
  CheckCircle2,
  Bold,
  Italic,
  Heading1,
  Heading2,
  List,
  Code,
  Quote,
} from "lucide-react";
import { MoveDocumentModal } from "./move-document-modal";
import { DocumentVersionHistoryDrawer } from "./document-version-history-drawer";
import { AiAssistantDrawer } from "@/components/ai/ai-assistant-drawer";
import { formatRelativeTime } from "@/lib/utils";
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

interface DocumentEditorProps {
  workspaceId: string;
  documentId: string;
  initialDocument: DocumentDetail;
  availableFolders: FolderOption[];
  onOpenAiAssistant?: () => void;
}

export function DocumentEditor({
  workspaceId,
  documentId,
  initialDocument,
  availableFolders,
  onOpenAiAssistant,
}: DocumentEditorProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initialDocument.title);
  const [content, setContent] = useState(initialDocument.content);
  const [currentFolder] = useState(initialDocument.folder);
  const [versionsCount, setVersionsCount] = useState(initialDocument.versionsCount || 1);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved">("saved");
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [isVersionDrawerOpen, setIsVersionDrawerOpen] = useState(false);
  const [isAiDrawerOpen, setIsAiDrawerOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string>(initialDocument.updatedAt);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const charCount = content.length;

  const saveDocument = useCallback(
    async (newTitle = title, newContent = content) => {
      setSaveStatus("saving");
      try {
        const res = await fetch(`/api/workspaces/${workspaceId}/documents/${documentId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: newTitle,
            content: newContent,
          }),
        });

        const data: ApiResponse<{ document: DocumentDetail }> = await res.json();
        if (data.success) {
          setSaveStatus("saved");
          setLastSavedAt(new Date().toISOString());
        } else {
          setSaveStatus("unsaved");
        }
      } catch {
        setSaveStatus("unsaved");
      }
    },
    [workspaceId, documentId, title, content]
  );

  // Handle title & content changes with unsaved indicator & debounced auto-save
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
    setSaveStatus("unsaved");
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    setSaveStatus("unsaved");
  };

  // Debounced auto-save when unsaved
  useEffect(() => {
    if (saveStatus !== "unsaved") return;

    const timeout = setTimeout(() => {
      saveDocument(title, content);
    }, 2000);

    return () => clearTimeout(timeout);
  }, [saveStatus, title, content, saveDocument]);

  // Keyboard shortcut Ctrl+S / Cmd+S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        saveDocument(title, content);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [saveDocument, title, content]);

  const insertFormatting = (prefix: string, suffix = "") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const previousText = textarea.value;
    const selectedText = previousText.substring(start, end);

    const newText =
      previousText.substring(0, start) +
      prefix +
      selectedText +
      suffix +
      previousText.substring(end);

    setContent(newText);
    setSaveStatus("unsaved");
    textarea.focus();

    setTimeout(() => {
      textarea.setSelectionRange(start + prefix.length, end + prefix.length);
    }, 0);
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/documents/${documentId}`, {
        method: "DELETE",
      });

      const data: ApiResponse<{ deleted: boolean }> = await res.json();
      if (data.success) {
        router.push(`/workspaces/${workspaceId}/documents`);
      }
    } catch {
      alert("Failed to delete document");
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100">
      {/* Top Document Toolbar */}
      <div className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md px-6 py-3 flex items-center justify-between gap-4 sticky top-0 z-30">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => setIsMoveModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 transition-colors"
          >
            <FolderInput className="h-3.5 w-3.5 text-indigo-400" />
            <span>{currentFolder ? currentFolder.name : "Root"}</span>
          </button>

          <span className="text-slate-600 hidden sm:inline">•</span>

          {/* Auto-Save status badge */}
          <div className="flex items-center gap-1.5 text-xs">
            {saveStatus === "saving" && (
              <span className="text-cyan-400 flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>Saving...</span>
              </span>
            )}
            {saveStatus === "saved" && (
              <span className="text-slate-400 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                <span className="hidden sm:inline">Saved</span>
              </span>
            )}
            {saveStatus === "unsaved" && (
              <span className="text-amber-400 flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                <span>Unsaved changes</span>
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Markdown editor formatting toolbar (in edit mode) */}
          {!isPreviewMode && (
            <div className="hidden md:flex items-center gap-1 border-r border-slate-800 pr-2 mr-1">
              <button
                type="button"
                onClick={() => insertFormatting("**", "**")}
                title="Bold"
                className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200"
              >
                <Bold className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => insertFormatting("*", "*")}
                title="Italic"
                className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200"
              >
                <Italic className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => insertFormatting("# ")}
                title="Heading 1"
                className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200"
              >
                <Heading1 className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => insertFormatting("## ")}
                title="Heading 2"
                className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200"
              >
                <Heading2 className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => insertFormatting("- ")}
                title="Bullet List"
                className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200"
              >
                <List className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => insertFormatting("```\n", "\n```")}
                title="Code Block"
                className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200"
              >
                <Code className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => insertFormatting("> ")}
                title="Quote"
                className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200"
              >
                <Quote className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* Version History Button */}
          <button
            onClick={() => setIsVersionDrawerOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 transition-colors"
          >
            <History className="h-3.5 w-3.5 text-indigo-400" />
            <span>v{versionsCount}</span>
          </button>

          {/* Preview / Edit Toggle */}
          <button
            onClick={() => setIsPreviewMode(!isPreviewMode)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 transition-colors"
          >
            {isPreviewMode ? (
              <>
                <Edit3 className="h-3.5 w-3.5 text-indigo-400" />
                <span>Edit</span>
              </>
            ) : (
              <>
                <Eye className="h-3.5 w-3.5 text-cyan-400" />
                <span>Preview</span>
              </>
            )}
          </button>

          {/* Manual Save */}
          <button
            onClick={() => saveDocument(title, content)}
            disabled={saveStatus === "saving"}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors cursor-pointer"
          >
            <Save className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Save</span>
          </button>

          {/* AI Assistant button */}
          <button
            onClick={onOpenAiAssistant || (() => setIsAiDrawerOpen(true))}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white text-xs font-medium transition-all shadow-md cursor-pointer"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">AI Assist</span>
          </button>

          {/* Delete action */}
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            title="Delete Document"
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Editor Canvas */}
      <div className="flex-1 max-w-4xl w-full mx-auto p-8 space-y-6 overflow-y-auto">
        {/* Document Title Input */}
        <div>
          <input
            type="text"
            value={title}
            onChange={handleTitleChange}
            placeholder="Untitled Document"
            className="w-full text-3xl sm:text-4xl font-extrabold bg-transparent text-slate-100 placeholder-slate-600 focus:outline-none tracking-tight border-b border-transparent focus:border-slate-800 pb-2 transition-colors"
          />
        </div>

        {/* Metadata info row */}
        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pb-4 border-b border-slate-800/80">
          <div className="flex items-center gap-1.5">
            <User className="h-3.5 w-3.5 text-slate-500" />
            <span>{initialDocument.author.name || initialDocument.author.email}</span>
          </div>

          <span>•</span>

          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-slate-500" />
            <span>Updated {formatRelativeTime(lastSavedAt)}</span>
          </div>

          <span>•</span>

          <button
            onClick={() => setIsVersionDrawerOpen(true)}
            className="flex items-center gap-1.5 hover:text-indigo-400 transition-colors"
          >
            <History className="h-3.5 w-3.5 text-slate-500" />
            <span>Version {versionsCount}</span>
          </button>

          <div className="ml-auto text-slate-500">
            {wordCount} words • {charCount} chars
          </div>
        </div>

        {/* Editor vs Markdown Preview */}
        {isPreviewMode ? (
          <div className="prose prose-invert max-w-none prose-slate prose-headings:font-bold prose-headings:text-slate-100 prose-p:text-slate-300 prose-pre:bg-slate-900 prose-pre:border prose-pre:border-slate-800 min-h-[400px]">
            {content.trim() ? (
              <div className="whitespace-pre-wrap font-sans text-slate-200 leading-relaxed">
                {content}
              </div>
            ) : (
              <p className="text-slate-500 italic">No content in this document yet.</p>
            )}
          </div>
        ) : (
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleContentChange}
            placeholder="Start typing markdown or notes here..."
            className="w-full min-h-[500px] bg-transparent text-slate-200 placeholder-slate-600 focus:outline-none resize-none font-mono text-sm leading-relaxed"
          />
        )}
      </div>

      <MoveDocumentModal
        workspaceId={workspaceId}
        documentId={documentId}
        documentTitle={title}
        currentFolderId={currentFolder?.id || null}
        isOpen={isMoveModalOpen}
        onClose={() => setIsMoveModalOpen(false)}
        availableFolders={availableFolders}
        onSuccess={() => {
          router.refresh();
        }}
      />

      <DocumentVersionHistoryDrawer
        workspaceId={workspaceId}
        documentId={documentId}
        isOpen={isVersionDrawerOpen}
        onClose={() => setIsVersionDrawerOpen(false)}
        onRestore={(restored) => {
          setTitle(restored.title);
          setContent(restored.content);
          setVersionsCount(restored.versionsCount);
          setSaveStatus("saved");
          setLastSavedAt(new Date().toISOString());
        }}
      />

      <AiAssistantDrawer
        workspaceId={workspaceId}
        documentId={documentId}
        documentTitle={title}
        isOpen={isAiDrawerOpen}
        onClose={() => setIsAiDrawerOpen(false)}
      />
    </div>
  );
}
