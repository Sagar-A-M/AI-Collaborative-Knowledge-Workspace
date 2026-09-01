"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Sparkles,
  Send,
  FileText,
  Bot,
  User as UserIcon,
  Loader2,
  AlertCircle,
  ExternalLink,
  HelpCircle,
  BookOpen,
} from "lucide-react";
import type { ApiResponse } from "@/types/api";
import type { QnACitation } from "@/services/ai/types";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: QnACitation[];
  timestamp: string;
}

export default function WorkspaceAiAssistantPage() {
  const params = useParams();
  const workspaceId = params?.workspaceId as string;
  const messageCounter = useRef(0);

  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Welcome to the AI Knowledge Assistant! I can search and synthesize knowledge across all documents, specs, and notes in this workspace. Ask a question below or choose a suggested topic.",
      timestamp: "Ready",
    },
  ]);
  const [isAsking, setIsAsking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const suggestedQuestions = [
    "What are our core architectural guidelines and conventions?",
    "Summarize all documents created or updated recently.",
    "Explain our authentication and authorization system.",
    "What folders and knowledge areas are defined in this workspace?",
  ];

  const handleAsk = async (userQuestion: string) => {
    if (!userQuestion.trim() || isAsking) return;

    setQuestion("");
    setError(null);
    messageCounter.current += 1;

    const userMsg: Message = {
      id: `user-${messageCounter.current}`,
      role: "user",
      content: userQuestion.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsAsking(true);

    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/ai/qna`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: userQuestion.trim(),
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

      messageCounter.current += 1;
      const aiMsg: Message = {
        id: `ai-${messageCounter.current}`,
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

  return (
    <main className="p-8 max-w-5xl mx-auto space-y-8 flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2.5">
            <Sparkles className="h-6 w-6 text-indigo-400" />
            <span>AI Knowledge Assistant</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Grounded intelligence querying your workspace&apos;s documents and architecture specs
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Link
            href={`/workspaces/${workspaceId}/documents`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-medium transition-colors"
          >
            <BookOpen className="h-3.5 w-3.5 text-cyan-400" />
            <span>Browse Docs</span>
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-start gap-2.5 shrink-0">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Suggested prompts if only 1 message */}
      {messages.length === 1 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 shrink-0">
          {suggestedQuestions.map((sq, i) => (
            <button
              key={i}
              onClick={() => handleAsk(sq)}
              className="p-3.5 rounded-2xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 text-left transition-all group cursor-pointer shadow-md"
            >
              <div className="flex items-center gap-2 text-indigo-400 mb-1">
                <HelpCircle className="h-3.5 w-3.5" />
                <span className="text-[11px] font-semibold uppercase tracking-wider">
                  Suggested Query
                </span>
              </div>
              <p className="text-xs text-slate-300 group-hover:text-white transition-colors">
                {sq}
              </p>
            </button>
          ))}
        </div>
      )}

      {/* Chat Messages Container */}
      <div className="flex-1 overflow-y-auto p-6 rounded-3xl bg-slate-900/60 border border-slate-800 shadow-xl space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {msg.role === "assistant" && (
              <div className="h-8 w-8 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shrink-0 mt-0.5 shadow-md">
                <Bot className="h-4 w-4" />
              </div>
            )}

            <div
              className={`max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed ${
                msg.role === "user"
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/25"
                  : "bg-slate-950/90 border border-slate-800 text-slate-200 shadow-md"
              }`}
            >
              <div className="whitespace-pre-wrap">{msg.content}</div>

              {msg.citations && msg.citations.length > 0 && (
                <div className="mt-3.5 pt-3 border-t border-slate-800/80 space-y-2">
                  <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    Referenced Documents:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {msg.citations.map((cite) => (
                      <Link
                        key={cite.documentId}
                        href={`/workspaces/${workspaceId}/documents/${cite.documentId}`}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] bg-slate-900 hover:bg-slate-800 border border-slate-700 text-indigo-300 transition-colors"
                      >
                        <FileText className="h-3 w-3 text-cyan-400" />
                        <span className="truncate max-w-[180px]">{cite.title}</span>
                        <ExternalLink className="h-2.5 w-2.5 text-slate-500" />
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-1.5 text-[9px] text-slate-500 text-right">{msg.timestamp}</div>
            </div>

            {msg.role === "user" && (
              <div className="h-8 w-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white shrink-0 mt-0.5 shadow-md">
                <UserIcon className="h-4 w-4" />
              </div>
            )}
          </div>
        ))}

        {isAsking && (
          <div className="flex gap-3.5 justify-start">
            <div className="h-8 w-8 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shrink-0 shadow-md">
              <Bot className="h-4 w-4" />
            </div>
            <div className="rounded-2xl p-4 bg-slate-950/90 border border-slate-800 text-xs text-slate-400 flex items-center gap-2.5 shadow-md">
              <Loader2 className="h-4 w-4 animate-spin text-indigo-400" />
              <span>Analyzing workspace context &amp; drafting answer...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleAsk(question);
        }}
        className="flex items-center gap-3 shrink-0"
      >
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask anything about documents, architectural specs, or team knowledge..."
          disabled={isAsking}
          className="flex-1 px-4 py-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/60 shadow-xl"
        />
        <button
          type="submit"
          disabled={isAsking || !question.trim()}
          className="px-5 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-medium text-xs shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
          <span className="hidden sm:inline">Ask AI</span>
        </button>
      </form>
    </main>
  );
}
