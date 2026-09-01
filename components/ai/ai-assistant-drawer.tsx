"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import {
  X,
  Sparkles,
  Send,
  FileText,
  HelpCircle,
  BarChart3,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Copy,
  ExternalLink,
  Bot,
  User as UserIcon,
} from "lucide-react";
import type { ApiResponse } from "@/types/api";
import type { QnACitation, SummaryFormat } from "@/services/ai/types";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: QnACitation[];
  timestamp: string;
}

interface AiAssistantDrawerProps {
  workspaceId: string;
  documentId?: string;
  documentTitle?: string;
  isOpen: boolean;
  onClose: () => void;
}

export function AiAssistantDrawer({
  workspaceId,
  documentId,
  documentTitle,
  isOpen,
  onClose,
}: AiAssistantDrawerProps) {
  const [activeTab, setActiveTab] = useState<"qna" | "summarize" | "digest">(
    documentId ? "summarize" : "qna"
  );
  const msgCounter = useRef(0);

  // Q&A state
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hello! I am your AI Knowledge Assistant. Ask me anything about this workspace's documents, architecture, or meeting notes.",
      timestamp: "Ready",
    },
  ]);
  const [isAsking, setIsAsking] = useState(false);

  // Summarize state
  const [summaryFormat, setSummaryFormat] = useState<SummaryFormat>("bullets");
  const [summaryResult, setSummaryResult] = useState<{
    summary: string;
    keyPoints: string[];
  } | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);

  // Workspace Digest state
  const [digestResult, setDigestResult] = useState<{
    summary: string;
    keyTopics: string[];
    totalDocumentsAnalyzed: number;
  } | null>(null);
  const [isGeneratingDigest, setIsGeneratingDigest] = useState(false);

  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAskQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || isAsking) return;

    const userQ = question.trim();
    setQuestion("");
    setError(null);
    msgCounter.current += 1;

    const userMsg: Message = {
      id: `drawer-user-${msgCounter.current}`,
      role: "user",
      content: userQ,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsAsking(true);

    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/ai/qna`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: userQ,
          documentIds: documentId ? [documentId] : undefined,
        }),
      });

      const data: ApiResponse<{
        answer: {
          answer: string;
          citations: QnACitation[];
        };
      }> = await res.json();

      if (!data.success) {
        setError(data.error.message);
        return;
      }

      msgCounter.current += 1;
      const aiMsg: Message = {
        id: `drawer-ai-${msgCounter.current}`,
        role: "assistant",
        content: data.data.answer.answer,
        citations: data.data.answer.citations,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      setError("Failed to get answer from AI Assistant");
    } finally {
      setIsAsking(false);
    }
  };

  const handleSummarizeDocument = async () => {
    if (!documentId) return;
    setIsSummarizing(true);
    setError(null);

    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/ai/summarize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentId,
          format: summaryFormat,
        }),
      });

      const data: ApiResponse<{
        summary: {
          summary: string;
          keyPoints: string[];
        };
      }> = await res.json();

      if (!data.success) {
        setError(data.error.message);
        return;
      }

      setSummaryResult(data.data.summary);
    } catch {
      setError("Failed to summarize document");
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleGenerateDigest = async () => {
    setIsGeneratingDigest(true);
    setError(null);

    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/ai/workspace-summary`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ includeRecentOnly: false }),
      });

      const data: ApiResponse<{
        summary: {
          summary: string;
          keyTopics: string[];
          totalDocumentsAnalyzed: number;
        };
      }> = await res.json();

      if (!data.success) {
        setError(data.error.message);
        return;
      }

      setDigestResult(data.data.summary);
    } catch {
      setError("Failed to generate workspace digest");
    } finally {
      setIsGeneratingDigest(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-xl h-full bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        {/* Drawer Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-400 p-0.5 shadow-md flex items-center justify-center">
              <div className="h-full w-full bg-slate-950 rounded-[9px] flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-indigo-400" />
              </div>
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-1.5">
                <span>AI Knowledge Assistant</span>
              </h2>
              <p className="text-[11px] text-slate-400">
                {documentTitle ? `Scoped to "${documentTitle}"` : "Workspace-wide intelligence"}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-3">
          <button
            onClick={() => setActiveTab("qna")}
            className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 transition-all ${
              activeTab === "qna"
                ? "border-indigo-500 text-indigo-300"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <HelpCircle className="h-3.5 w-3.5" />
            <span>Ask Questions</span>
          </button>

          {documentId && (
            <button
              onClick={() => setActiveTab("summarize")}
              className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 transition-all ${
                activeTab === "summarize"
                  ? "border-indigo-500 text-indigo-300"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              <FileText className="h-3.5 w-3.5" />
              <span>Summarize Doc</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab("digest")}
            className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 transition-all ${
              activeTab === "digest"
                ? "border-indigo-500 text-indigo-300"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <BarChart3 className="h-3.5 w-3.5" />
            <span>Workspace Digest</span>
          </button>
        </div>

        {error && (
          <div className="m-4 mb-0 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-start gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Tab 1: Q&A Chat */}
        {activeTab === "qna" && (
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role === "assistant" && (
                    <div className="h-7 w-7 rounded-lg bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
                      <Bot className="h-4 w-4" />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                      msg.role === "user"
                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                        : "bg-slate-950/80 border border-slate-800 text-slate-200"
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{msg.content}</div>

                    {msg.citations && msg.citations.length > 0 && (
                      <div className="mt-3 pt-2.5 border-t border-slate-800/80 space-y-1.5">
                        <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                          Sources Cited:
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {msg.citations.map((cite) => (
                            <Link
                              key={cite.documentId}
                              href={`/workspaces/${workspaceId}/documents/${cite.documentId}`}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-slate-900 hover:bg-slate-800 border border-slate-700 text-indigo-300 transition-colors"
                            >
                              <FileText className="h-2.5 w-2.5" />
                              <span className="truncate max-w-[140px]">{cite.title}</span>
                              <ExternalLink className="h-2 w-2" />
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="mt-1 text-[9px] text-slate-400 text-right">{msg.timestamp}</div>
                  </div>

                  {msg.role === "user" && (
                    <div className="h-7 w-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white shrink-0 mt-0.5">
                      <UserIcon className="h-4 w-4" />
                    </div>
                  )}
                </div>
              ))}

              {isAsking && (
                <div className="flex gap-3 justify-start">
                  <div className="h-7 w-7 rounded-lg bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shrink-0">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="rounded-2xl p-3.5 bg-slate-950/80 border border-slate-800 text-xs text-slate-400 flex items-center gap-2">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-400" />
                    <span>Searching workspace documents &amp; synthesizing answer...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Question input form */}
            <form
              onSubmit={handleAskQuestion}
              className="p-3 border-t border-slate-800 bg-slate-950/80 flex items-center gap-2"
            >
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask about workspace specs, decisions, notes..."
                disabled={isAsking}
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/60"
              />
              <button
                type="submit"
                disabled={isAsking || !question.trim()}
                className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-colors disabled:opacity-50 cursor-pointer shadow-md"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        )}

        {/* Tab 2: Summarize Document */}
        {activeTab === "summarize" && documentId && (
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300">Summary Format</span>
                <div className="flex items-center gap-1">
                  {(["bullets", "paragraph", "executive"] as SummaryFormat[]).map((fmt) => (
                    <button
                      key={fmt}
                      onClick={() => setSummaryFormat(fmt)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                        summaryFormat === fmt
                          ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/40"
                          : "bg-slate-900 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {fmt.charAt(0).toUpperCase() + fmt.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleSummarizeDocument}
                disabled={isSummarizing}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white text-xs font-semibold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSummarizing ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Analyzing Document...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Summarize Current Document</span>
                  </>
                )}
              </button>
            </div>

            {summaryResult && (
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="text-xs font-bold text-slate-200">Generated Summary</span>
                  <button
                    onClick={() => copyToClipboard(summaryResult.summary)}
                    className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    {copied ? (
                      <>
                        <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
                  {summaryResult.summary}
                </div>

                {summaryResult.keyPoints.length > 0 && (
                  <div className="pt-3 border-t border-slate-800/80 space-y-1.5">
                    <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                      Key Takeaways:
                    </div>
                    <ul className="space-y-1 text-xs text-slate-300">
                      {summaryResult.keyPoints.map((pt, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-indigo-400 mt-0.5">•</span>
                          <span>{pt}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Workspace Digest */}
        {activeTab === "digest" && (
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3 text-center">
              <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
                <BarChart3 className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-100">
                Workspace Executive Knowledge Digest
              </h3>
              <p className="text-xs text-slate-400">
                Synthesize high-level overview, key themes, and document inventory across the
                workspace.
              </p>

              <button
                onClick={handleGenerateDigest}
                disabled={isGeneratingDigest}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white text-xs font-semibold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isGeneratingDigest ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Synthesizing Knowledge Base...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Generate Workspace Digest</span>
                  </>
                )}
              </button>
            </div>

            {digestResult && (
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="text-xs font-bold text-slate-200">Executive Digest</span>
                  <span className="text-[10px] text-slate-400">
                    {digestResult.totalDocumentsAnalyzed} docs analyzed
                  </span>
                </div>

                <div className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
                  {digestResult.summary}
                </div>

                {digestResult.keyTopics.length > 0 && (
                  <div className="pt-3 border-t border-slate-800/80 space-y-1.5">
                    <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                      Identified Topics:
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {digestResult.keyTopics.map((topic, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded text-[10px] bg-slate-900 border border-slate-700 text-cyan-300"
                        >
                          #{topic}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
