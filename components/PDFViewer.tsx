// components/PDFViewer.tsx
//
// RIGHT PANEL — High-Fidelity PDF Viewer
// ─────────────────────────────────────────────────────────────────────────────
// Renders a PDF using react-pdf (which uses Mozilla's pdf.js under the hood).
//
// THE MAGIC: This component listens for a custom browser event
// "contextos:jump-to-page" dispatched by ChatPanel's citation buttons.
// When received, it smoothly scrolls and highlights the target page.
//
// IMPORTANT: This must be a Client Component ("use client") because react-pdf
// is a browser-only library. We also use dynamic import in page.tsx to prevent
// SSR from trying to render it.
// ─────────────────────────────────────────────────────────────────────────────

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  FileX,
  Loader2,
  BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Configure pdf.js Worker ──────────────────────────────────────────────────
// react-pdf v9 requires you to set the worker source explicitly.
// We use the CDN version to avoid bundling issues with Next.js.
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

// ─── Types ────────────────────────────────────────────────────────────────────

interface PDFViewerProps {
  pdfUrl: string | null;
  documentTitle: string;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function PDFViewer({ pdfUrl, documentTitle }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [jumpedPage, setJumpedPage] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  // ── Listen for Citation Jump Events ─────────────────────────────────────────
  // ChatPanel dispatches "contextos:jump-to-page" when a user clicks a citation.
  useEffect(() => {
    function handleJumpToPage(event: Event) {
      const customEvent = event as CustomEvent<{ page: number }>;
      const targetPage = customEvent.detail.page;

      if (targetPage >= 1 && targetPage <= numPages) {
        setCurrentPage(targetPage);
        setJumpedPage(targetPage);

        // Scroll the page element into view
        const pageEl = pageRefs.current.get(targetPage);
        if (pageEl) {
          pageEl.scrollIntoView({ behavior: "smooth", block: "start" });
        }

        // Remove the "jumped" highlight after 2 seconds
        setTimeout(() => setJumpedPage(null), 2000);
      }
    }

    window.addEventListener("contextos:jump-to-page", handleJumpToPage);
    return () => {
      window.removeEventListener("contextos:jump-to-page", handleJumpToPage);
    };
  }, [numPages]);

  // Reset state when a new PDF is loaded
  useEffect(() => {
    setCurrentPage(1);
    setNumPages(0);
    setIsLoading(true);
    setError(null);
    setJumpedPage(null);
    pageRefs.current.clear();
  }, [pdfUrl]);

  // ── PDF Load Handlers ────────────────────────────────────────────────────────
  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setIsLoading(false);
    setError(null);
  }

  function onDocumentLoadError(err: Error) {
    console.error("[PDFViewer] Load error:", err);
    setIsLoading(false);
    setError(
      "Failed to load the PDF. Check that the file exists in /public/docs/ and the path in lib/documents.ts is correct."
    );
  }

  // ── Page Navigation ──────────────────────────────────────────────────────────
  function goToPrevPage() {
    if (currentPage > 1) {
      const newPage = currentPage - 1;
      setCurrentPage(newPage);
      pageRefs.current.get(newPage)?.scrollIntoView({ behavior: "smooth" });
    }
  }

  function goToNextPage() {
    if (currentPage < numPages) {
      const newPage = currentPage + 1;
      setCurrentPage(newPage);
      pageRefs.current.get(newPage)?.scrollIntoView({ behavior: "smooth" });
    }
  }

  // ── Zoom ─────────────────────────────────────────────────────────────────────
  function zoomIn() {
    setScale((s) => Math.min(s + 0.2, 2.5));
  }

  function zoomOut() {
    setScale((s) => Math.max(s - 0.2, 0.5));
  }

  function resetZoom() {
    setScale(1.0);
  }

  // ── Intersection Observer (track current page as user scrolls) ───────────────
  const registerPageRef = useCallback(
    (pageNum: number) => (el: HTMLDivElement | null) => {
      if (el) {
        pageRefs.current.set(pageNum, el);
      } else {
        pageRefs.current.delete(pageNum);
      }
    },
    []
  );

  // ── Empty State ──────────────────────────────────────────────────────────────
  if (!pdfUrl) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-slate-100 text-center px-8">
        <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 flex items-center justify-center mb-4 shadow-sm">
          <BookOpen className="w-8 h-8 text-slate-300" />
        </div>
        <h3 className="font-display text-2xl font-semibold text-slate-400 mb-2">
          Document Viewer
        </h3>
        <p className="text-sm text-slate-400 max-w-xs leading-relaxed">
          Select a document from the sidebar to view it here. AI citation clicks
          will automatically jump to the referenced page.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-100">

      {/* ── Toolbar ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-white border-b border-slate-200 shrink-0">
        {/* Document name */}
        <div className="flex-1 min-w-0 mr-4">
          <p className="text-xs font-medium text-slate-700 truncate">
            {documentTitle}
          </p>
          {!isLoading && numPages > 0 && (
            <p className="text-[10px] text-slate-400 font-mono-custom">
              {numPages} pages · {Math.round(scale * 100)}% zoom
            </p>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Zoom controls */}
          <button
            onClick={zoomOut}
            disabled={scale <= 0.5}
            className="toolbar-btn"
            title="Zoom out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={resetZoom}
            className="toolbar-btn text-[10px] font-mono-custom px-2"
            title="Reset zoom"
          >
            {Math.round(scale * 100)}%
          </button>
          <button
            onClick={zoomIn}
            disabled={scale >= 2.5}
            className="toolbar-btn"
            title="Zoom in"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>

          <div className="w-px h-5 bg-slate-200 mx-1" />

          {/* Page navigation */}
          <button
            onClick={goToPrevPage}
            disabled={currentPage <= 1}
            className="toolbar-btn"
            title="Previous page"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span className="text-[10px] font-mono-custom text-slate-500 px-1 min-w-[60px] text-center">
            {isLoading ? "—" : `${currentPage} / ${numPages}`}
          </span>
          <button
            onClick={goToNextPage}
            disabled={currentPage >= numPages}
            className="toolbar-btn"
            title="Next page"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── PDF Render Area ──────────────────────────────────────────────────── */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto px-6 py-6"
      >
        {/* Loading state */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center h-64 gap-3">
            <Loader2 className="w-8 h-8 text-gold-500 animate-spin" />
            <p className="text-sm text-slate-400">Loading document...</p>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="flex flex-col items-center justify-center h-64 gap-3 text-center px-6">
            <FileX className="w-10 h-10 text-red-400" />
            <p className="text-sm font-medium text-slate-600">Failed to load PDF</p>
            <p className="text-xs text-slate-400 max-w-xs leading-relaxed">{error}</p>
          </div>
        )}

        {/* PDF Document */}
        <Document
          file={pdfUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={onDocumentLoadError}
          className="flex flex-col items-center"
          loading={null} // We handle loading state ourselves above
        >
          {Array.from({ length: numPages }, (_, index) => {
            const pageNum = index + 1;
            const isJumped = jumpedPage === pageNum;

            return (
              <div
                key={pageNum}
                ref={registerPageRef(pageNum)}
                className={cn(
                  "mb-4 rounded-lg overflow-hidden transition-all duration-500",
                  isJumped
                    ? "ring-2 ring-gold-400 ring-offset-2 ring-offset-slate-100"
                    : "ring-0"
                )}
              >
                {/* Page number badge */}
                <div
                  className={cn(
                    "flex items-center justify-center py-1 text-[10px] font-mono-custom transition-colors",
                    isJumped
                      ? "bg-gold-500 text-navy-900 font-medium"
                      : "bg-slate-200 text-slate-500"
                  )}
                >
                  {isJumped ? `↗ Cited: Page ${pageNum}` : `Page ${pageNum}`}
                </div>

                <Page
                  pageNumber={pageNum}
                  scale={scale}
                  renderTextLayer={true}
                  renderAnnotationLayer={true}
                />
              </div>
            );
          })}
        </Document>
      </div>

      {/* ── Tailwind classes that can't be dynamic — declared here ─────────── */}
      <style jsx>{`
        .toolbar-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          min-width: 28px;
          height: 28px;
          border-radius: 6px;
          color: #475569;
          transition: all 0.15s ease;
          font-size: 0.75rem;
        }
        .toolbar-btn:hover:not(:disabled) {
          background: #f1f5f9;
          color: #1e293b;
        }
        .toolbar-btn:disabled {
          opacity: 0.35;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}
