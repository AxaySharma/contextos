// components/ChatPanel.tsx
//
// LEFT CHAT PANEL — The AI Conversation Interface
// ─────────────────────────────────────────────────────────────────────────────
// Features:
// - Displays conversation history
// - Renders AI responses with CLICKABLE CITATION BUTTONS ([Page N] → jumps PDF)
// - Typing indicator while AI is thinking
// - Auto-scrolls to the latest message
// - Empty state prompts when no document is selected

"use client";

import { useEffect, useRef, useState } from "react";
import {
  Send,
  Bot,
  User,
  Sparkles,
  FileWarning,
  AlertCircle,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";
import type { Document } from "@/lib/documents";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface ChatPanelProps {
  selectedDocument: Document | null;
  messages: Message[];
  isLoading: boolean;
  onSendMessage: (message: string) => void;
}

function MarkdownContent({ content }: { content: string }) {
  // Pre-process citations: [Page N] -> [↗ Page N](#page-N)
  // This allows ReactMarkdown to handle them as links, which we then customize.
  const processedContent = content.replace(/\[Page (\d+)\]/g, "[↗ Page $1](#page-$1)");

  return (
    <ReactMarkdown
      components={{
        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
        strong: ({ children }) => <strong className="font-semibold text-slate-900">{children}</strong>,
        a: ({ href, children }) => {
          if (href?.startsWith("#page-")) {
            const pageNumber = parseInt(href.replace("#page-", ""), 10);
            return (
              <button
                className="citation-btn mx-0.5"
                onClick={() => {
                  const event = new CustomEvent("contextos:jump-to-page", {
                    detail: { page: pageNumber },
                  });
                  window.dispatchEvent(event);
                }}
                title={`Jump to Page ${pageNumber}`}
              >
                {children}
              </button>
            );
          }
          return (
            <a href={href} className="text-gold-500 hover:underline" target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          );
        },
      }}
    >
      {processedContent}
    </ReactMarkdown>
  );
}

// ─── Starter Prompts ──────────────────────────────────────────────────────────

const STARTER_PROMPTS = [
  "Summarize the key findings of this document.",
  "What are the main risk factors mentioned?",
  "What financial figures are highlighted?",
  "Give me the executive summary.",
];

// ─── Sub-Components ───────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="flex items-start gap-3 animate-fade-in">
      <div className="flex items-center justify-center w-7 h-7 rounded-full bg-navy-800 border border-navy-600 shrink-0">
        <Bot className="w-3.5 h-3.5 text-gold-400" />
      </div>
      <div className="flex items-center gap-1.5 bg-slate-100 border border-slate-200 rounded-2xl rounded-tl-sm px-4 py-3">
        <span className="typing-dot" />
        <span className="typing-dot" />
        <span className="typing-dot" />
      </div>
    </div>
  );
}

function EmptyState({
  selectedDocument,
  onStarterClick,
}: {
  selectedDocument: Document | null;
  onStarterClick: (prompt: string) => void;
}) {
  if (!selectedDocument) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-8">
        <div className="w-14 h-14 rounded-2xl bg-navy-800 border border-navy-600 flex items-center justify-center mb-4">
          <FileWarning className="w-7 h-7 text-slate-500" />
        </div>
        <h3 className="font-display text-2xl font-semibold text-slate-700 mb-2">
          No Document Selected
        </h3>
        <p className="text-sm text-slate-400 max-w-xs leading-relaxed">
          Select a document from the library on the left to begin your analysis
          session.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-8">
      <div className="w-14 h-14 rounded-2xl bg-navy-800 border border-gold-500/30 flex items-center justify-center mb-4">
        <Sparkles className="w-6 h-6 text-gold-400" />
      </div>
      <h3 className="font-display text-2xl font-semibold text-slate-700 mb-1">
        Ready to Analyse
      </h3>
      <p className="text-sm text-slate-500 mb-1 font-medium">
        {selectedDocument.title}
      </p>
      <p className="text-xs text-slate-400 mb-6 max-w-xs leading-relaxed">
        Ask anything about this document. The AI will cite exact page numbers —
        click any citation to jump to that page in the viewer.
      </p>

      {/* Starter prompt chips */}
      <div className="flex flex-col gap-2 w-full max-w-sm">
        {STARTER_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            onClick={() => onStarterClick(prompt)}
            className="
              text-left text-xs text-slate-600 bg-white hover:bg-slate-50
              border border-slate-200 hover:border-slate-300
              rounded-xl px-4 py-2.5 transition-all duration-150
              hover:shadow-sm
            "
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ChatPanel({
  selectedDocument,
  messages,
  isLoading,
  onSendMessage,
}: ChatPanelProps) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Auto-resize textarea as user types
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading || !selectedDocument) return;
    onSendMessage(trimmed);
    setInput("");
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    // Send on Enter (without Shift). Shift+Enter = new line.
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  const hasMessages = messages.length > 0;

  return (
    <div className="flex flex-col h-full bg-slate-50">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-5 py-3.5 bg-white border-b border-slate-200 shrink-0">
        <div>
          <h2 className="text-sm font-semibold text-slate-800">
            {selectedDocument ? selectedDocument.title : "Analysis Chat"}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {selectedDocument
              ? `${selectedDocument.category} · ${selectedDocument.pageCount} pages`
              : "Select a document to begin"}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="text-[10px] text-slate-400 font-mono-custom bg-slate-100 px-2 py-1 rounded-md">
            Gemini 2.5 Flash
          </div>
        </div>
      </div>

      {/* ── Messages Area ───────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-5 py-5">
        {!hasMessages ? (
          <EmptyState
            selectedDocument={selectedDocument}
            onStarterClick={(prompt) => {
              setInput(prompt);
              textareaRef.current?.focus();
            }}
          />
        ) : (
          <div className="space-y-5 max-w-none">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex items-start gap-3 animate-fade-in",
                  msg.role === "user" ? "flex-row-reverse" : "flex-row"
                )}
              >
                {/* Avatar */}
                <div
                  className={cn(
                    "flex items-center justify-center w-7 h-7 rounded-full shrink-0 border",
                    msg.role === "user"
                      ? "bg-navy-800 border-navy-600"
                      : "bg-white border-slate-200"
                  )}
                >
                  {msg.role === "user" ? (
                    <User className="w-3.5 h-3.5 text-gold-400" />
                  ) : (
                    <Bot className="w-3.5 h-3.5 text-gold-500" />
                  )}
                </div>

                {/* Bubble */}
                <div
                  className={cn(
                    "max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                    msg.role === "user"
                      ? "bg-navy-800 text-slate-100 rounded-tr-sm"
                      : "bg-white border border-slate-200 text-slate-700 rounded-tl-sm shadow-sm"
                  )}
                >
                  {msg.role === "assistant" ? (
                    <div className="markdown-content">
                      <MarkdownContent content={msg.content} />
                    </div>
                  ) : (
                    <p>{msg.content}</p>
                  )}
                  {/* Timestamp */}
                  <p
                    className={cn(
                      "text-[10px] mt-2",
                      msg.role === "user" ? "text-slate-500 text-right" : "text-slate-400"
                    )}
                  >
                    {msg.timestamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {isLoading && <TypingIndicator />}

            {/* Invisible div to scroll to */}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* ── Input Area ─────────────────────────────────────────────────────── */}
      <div className="px-5 py-4 bg-white border-t border-slate-200 shrink-0">
        {/* Warning when no document selected */}
        {!selectedDocument && (
          <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <p className="text-xs text-amber-700">
              Select a document from the sidebar to enable the chat.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex items-end gap-3">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              selectedDocument
                ? `Ask about "${selectedDocument.title}"...`
                : "Select a document to begin..."
            }
            disabled={!selectedDocument || isLoading}
            rows={1}
            className="
              flex-1 resize-none rounded-xl border border-slate-200
              bg-slate-50 px-4 py-3
              text-sm text-slate-800 placeholder:text-slate-400
              focus:outline-none focus:ring-2 focus:ring-gold-500/30 focus:border-gold-500/50
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-all duration-150
              max-h-32 overflow-y-auto
              leading-relaxed
            "
          />
          <button
            type="submit"
            disabled={!input.trim() || !selectedDocument || isLoading}
            className="
              flex items-center justify-center w-10 h-10 rounded-xl
              bg-navy-800 hover:bg-navy-700
              text-gold-400 hover:text-gold-300
              disabled:opacity-40 disabled:cursor-not-allowed
              transition-all duration-150
              shrink-0
            "
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

        <p className="text-[10px] text-slate-400 text-center mt-2">
          Click any{" "}
          <span className="font-mono-custom text-gold-500">↗ Page N</span>{" "}
          citation to jump to that page in the viewer.
        </p>
      </div>
    </div>
  );
}
