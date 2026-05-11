// app/page.tsx
//
// MAIN DASHBOARD — The ContextOS Split-Screen Experience
// ─────────────────────────────────────────────────────────────────────────────
// Layout:
//   [Sidebar 240px] | [Chat Panel flex-1] | [PDF Viewer flex-1]
//
// This is a Client Component because it holds shared state (selected document,
// messages, loading) and passes it down to child components.
//
// PDFViewer is dynamically imported (no SSR) because react-pdf is browser-only.
// ─────────────────────────────────────────────────────────────────────────────

"use client";

import { useState, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import { useSession } from "next-auth/react";
import { Sidebar } from "@/components/Sidebar";
import { ChatPanel, type Message } from "@/components/ChatPanel";
import { getDocumentsAction } from "./actions";
import type { Document } from "@/lib/documents";

// Dynamic import prevents react-pdf from running during Server-Side Rendering,
// which would crash because it needs browser APIs (canvas, etc.)
const PDFViewer = dynamic(
  () => import("@/components/PDFViewer").then((mod) => mod.PDFViewer),
  {
    ssr: false,
    loading: () => (
      <div className="flex-1 flex items-center justify-center bg-slate-100">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-400">Loading PDF viewer...</p>
        </div>
      </div>
    ),
  }
);

// ─── Utility: Generate unique message IDs ─────────────────────────────────────
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// ─── Main Page Component ──────────────────────────────────────────────────────

export default function DashboardPage() {
  const { data: session, status } = useSession();

  // ── State ──────────────────────────────────────────────────────────────────
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isFetchingDocs, setIsFetchingDocs] = useState<boolean>(true);

  // ── Effects ────────────────────────────────────────────────────────────────

  // Fetch documents on mount
  const fetchDocs = useCallback(async () => {
    setIsFetchingDocs(true);
    try {
      console.log('[page] Calling getDocumentsAction...');
      const data = await getDocumentsAction();
      console.log('[page] getDocumentsAction received:', data.length, 'docs');
      setDocuments(data);
      // Auto-select the first document if available and none selected
      if (data.length > 0 && !selectedDocument) {
        setSelectedDocument(data[0]);
      }
    } catch (err) {
      console.error("Failed to fetch documents via action:", err);
    } finally {
      setIsFetchingDocs(false);
    }
  }, [selectedDocument]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchDocs();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  // Select a document from the sidebar
  const handleSelectDocument = useCallback((doc: Document) => {
    setSelectedDocument(doc);
    // Clear the chat when switching documents
    setMessages([]);
    setIsLoading(false);
  }, []);

  // Clear all messages and start fresh
  const handleNewSession = useCallback(() => {
    setMessages([]);
    setSelectedDocument(null);
    setIsLoading(false);
  }, []);

  // Send a user message → call the Gemini API → display response
  const handleSendMessage = useCallback(
    async (userText: string) => {
      if (!selectedDocument || isLoading) return;

      // Add the user's message to the chat immediately
      const userMessage: Message = {
        id: generateId(),
        role: "user",
        content: userText,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);

      try {
        // Build the conversation history for the API (exclude the new message
        // we just added — we pass it as `message` separately)
        const history = messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        }));

        // Call our Next.js API route, which calls Gemini
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: userText,
            history,
            documentText: selectedDocument.extractedText,
            documentTitle: selectedDocument.title,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || `HTTP error ${response.status}`);
        }

        // Add the AI's response to the chat
        const assistantMessage: Message = {
          id: generateId(),
          role: "assistant",
          content: data.text,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, assistantMessage]);
      } catch (err) {
        // Show a friendly error message in the chat instead of a blank crash
        const errorText =
          err instanceof Error ? err.message : "An unknown error occurred.";

        const errorMessage: Message = {
          id: generateId(),
          role: "assistant",
          content: `⚠️ **Error:** ${errorText}\n\nPlease check your GEMINI_API_KEY in .env.local and try again.`,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
    },
    [selectedDocument, isLoading, messages]
  );

  // ── Loading / Unauthenticated States ───────────────────────────────────────

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center h-screen bg-navy-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-400 font-display italic">
            Initialising ContextOS...
          </p>
        </div>
      </div>
    );
  }

  // The middleware handles redirecting unauthenticated users to sign-in,
  // but we add this as a safety net fallback.
  if (status === "unauthenticated" || !session) {
    return (
      <div className="flex items-center justify-center h-screen bg-navy-950">
        <div className="text-center">
          <h2 className="font-display text-3xl text-slate-300 mb-2">
            Access Denied
          </h2>
          <p className="text-sm text-slate-500 mb-6">
            You must be signed in to access ContextOS.
          </p>
          <a
            href="/api/auth/signin"
            className="px-6 py-3 rounded-lg bg-gold-500 text-navy-900 font-semibold text-sm hover:bg-gold-400 transition-colors"
          >
            Sign In with Google
          </a>
        </div>
      </div>
    );
  }

  // ── Main Layout ────────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen overflow-hidden bg-navy-950">

      {/* Left Sidebar — Document Library */}
      <Sidebar
        documents={documents}
        selectedDocumentId={selectedDocument?.id ?? null}
        onSelectDocument={handleSelectDocument}
        onNewSession={handleNewSession}
        onUploadSuccess={fetchDocs}
        isLoading={isFetchingDocs}
      />

      {/* Center — Chat Panel */}
      <div className="flex-1 min-w-0 border-r border-navy-700 overflow-hidden">
        <ChatPanel
          selectedDocument={selectedDocument}
          messages={messages}
          isLoading={isLoading}
          onSendMessage={handleSendMessage}
        />
      </div>

      {/* Right — PDF Viewer */}
      <div className="flex-1 min-w-0 overflow-hidden">
        <PDFViewer
          pdfUrl={selectedDocument?.pdfPath ?? null}
          documentTitle={selectedDocument?.title ?? "Document Viewer"}
        />
      </div>
    </div>
  );
}
