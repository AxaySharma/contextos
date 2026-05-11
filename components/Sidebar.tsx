// components/Sidebar.tsx
//
// LEFT SIDEBAR — Document Library & Navigation
// ─────────────────────────────────────────────────────────────────────────────
// Shows:
// - ContextOS logo + wordmark
// - "New Session" button
// - Document library (list of available PDFs to analyze)
// - User profile at the bottom with sign-out

"use client";

import { useState, useRef } from "react";

import { signOut, useSession } from "next-auth/react";
import {
  FileText,
  LogOut,
  Plus,
  Shield,
  ChevronRight,
  Briefcase,
  ScrollText,
  Landmark,
  BarChart3,
  Upload,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { CATEGORY_STYLES, type Document } from "@/lib/documents";
import { cn } from "@/lib/utils";

// Maps document category to a lucide-react icon component
const CATEGORY_ICONS: Record<Document["category"], React.ElementType> = {
  IPO: BarChart3,
  Tax: ScrollText,
  Legal: Landmark,
  Advisory: Briefcase,
};

interface SidebarProps {
  documents: Document[];
  selectedDocumentId: string | null;
  onSelectDocument: (doc: Document) => void;
  onNewSession: () => void;
  onUploadSuccess?: () => void;
  isLoading?: boolean;
}

export function Sidebar({
  documents,
  selectedDocumentId,
  onSelectDocument,
  onNewSession,
  onUploadSuccess,
  isLoading = false,
}: SidebarProps) {
  const { data: session } = useSession();
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Derive initials from the user's name for the avatar
  const initials = session?.user?.name
    ? session.user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "??";

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        onUploadSuccess?.();
      } else {
        const data = await response.json();
        alert(data.error || "Upload failed");
      }
    } catch (err) {
      console.error("Upload error:", err);
      alert("An error occurred during upload");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <aside className="flex flex-col h-full w-60 shrink-0 bg-navy-800 border-r border-navy-700">

      {/* ── Logo ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-navy-700">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gold-500/20 border border-gold-500/30">
          <Shield className="w-4 h-4 text-gold-400" strokeWidth={1.5} />
        </div>
        <div>
          <h1 className="font-display text-xl font-semibold tracking-wide text-slate-100 leading-none">
            ContextOS
          </h1>
          <p className="text-[10px] text-slate-500 font-mono-custom tracking-widest uppercase mt-0.5">
            Private Oracle
          </p>
        </div>
      </div>

      {/* ── Action Buttons ────────────────────────────────────────────── */}
      <div className="px-4 pt-4 pb-2 space-y-2">
        <button
          onClick={onNewSession}
          className="
            w-full flex items-center justify-center gap-2 
            px-4 py-2.5 rounded-lg 
            bg-gold-500/10 hover:bg-gold-500/20 
            border border-gold-500/20 hover:border-gold-500/40
            text-gold-400 text-sm font-medium
            transition-all duration-200
            group
          "
        >
          <Plus className="w-3.5 h-3.5 group-hover:rotate-90 transition-transform duration-200" />
          New Analysis Session
        </button>

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="
            w-full flex items-center justify-center gap-2 
            px-4 py-2.5 rounded-lg 
            bg-navy-700 hover:bg-navy-600 
            border border-navy-600 hover:border-navy-500
            text-slate-300 text-sm font-medium
            transition-all duration-200
            disabled:opacity-50
          "
        >
          {isUploading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Upload className="w-3.5 h-3.5" />
          )}
          {isUploading ? "Uploading..." : "Upload Document"}
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleUpload}
          accept=".pdf"
          className="hidden"
        />
      </div>

      {/* ── Document Library ──────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        <div className="mb-2 px-1 flex items-center justify-between">
          <p className="text-[10px] font-medium text-slate-500 uppercase tracking-widest">
            Document Library
          </p>
          <button 
            onClick={onUploadSuccess}
            className="p-1 hover:bg-navy-700 rounded-md transition-colors"
            title="Refresh library"
            disabled={isLoading}
          >
            <RefreshCw className={cn("w-3 h-3 text-slate-500", isLoading && "animate-spin")} />
          </button>
        </div>

        <nav className="space-y-1">
          {isLoading ? (
            <div className="space-y-2 px-3 py-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 w-full bg-navy-700/50 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : documents.length === 0 ? (
            <div className="px-3 py-10 text-center">
              <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">No Documents Found</p>
              <p className="text-[9px] text-slate-600">Add PDFs to /public/docs/</p>
            </div>
          ) : (
            documents.map((doc) => {
              const isSelected = doc.id === selectedDocumentId;
              const CategoryIcon = CATEGORY_ICONS[doc.category] || FileText;
              const categoryStyle = CATEGORY_STYLES[doc.category] || CATEGORY_STYLES.Advisory;

              return (
                <button
                  key={doc.id}
                  onClick={() => onSelectDocument(doc)}
                  className={cn(
                    "w-full text-left rounded-lg px-3 py-3 transition-all duration-150 group",
                    isSelected
                      ? "bg-navy-600 border border-gold-500/30"
                      : "hover:bg-navy-700 border border-transparent"
                  )}
                >
                  <div className="flex items-start gap-2.5">
                    {/* Document type icon */}
                    <div
                      className={cn(
                        "mt-0.5 flex items-center justify-center w-7 h-7 rounded-md shrink-0 transition-colors",
                        isSelected
                          ? "bg-gold-500/20"
                          : "bg-navy-700 group-hover:bg-navy-600"
                      )}
                    >
                      <CategoryIcon
                        className={cn(
                          "w-3.5 h-3.5",
                          isSelected ? "text-gold-400" : "text-slate-400"
                        )}
                        strokeWidth={1.5}
                      />
                    </div>

                    {/* Document text */}
                    <div className="flex-1 min-w-0">
                      <p
                        className={cn(
                          "text-xs font-medium leading-snug truncate",
                          isSelected ? "text-slate-100" : "text-slate-300"
                        )}
                      >
                        {doc.title}
                      </p>
                      <p className="text-[10px] text-slate-500 truncate mt-0.5">
                        {doc.subtitle}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <span
                          className={cn(
                            "text-[9px] font-medium px-1.5 py-0.5 rounded-sm uppercase tracking-wide",
                            categoryStyle.bg,
                            categoryStyle.text
                          )}
                        >
                          {doc.category}
                        </span>
                        <span className="text-[9px] text-slate-600">
                          {doc.pageCount}p
                        </span>
                      </div>
                    </div>

                    {/* Selected indicator */}
                    <ChevronRight
                      className={cn(
                        "w-3 h-3 shrink-0 mt-1 transition-all",
                        isSelected
                          ? "text-gold-400 opacity-100"
                          : "text-slate-600 opacity-0 group-hover:opacity-100"
                      )}
                    />
                  </div>
                </button>
              );
            })
          )}
        </nav>

        {/* Removed manual registration hint as listing is now automated */}
      </div>

      {/* ── User Profile (Bottom) ─────────────────────────────────────────── */}
      <div className="px-4 py-4 border-t border-navy-700">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gold-500/20 border border-gold-500/30 shrink-0">
            <span className="text-xs font-semibold text-gold-400 font-display">
              {initials}
            </span>
          </div>

          {/* User info */}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-slate-200 truncate">
              {session?.user?.name || "User"}
            </p>
            <p className="text-[10px] text-slate-500 truncate">
              {session?.user?.email || ""}
            </p>
          </div>

          {/* Sign out */}
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="
              flex items-center justify-center w-7 h-7 rounded-md
              text-slate-500 hover:text-red-400 hover:bg-red-400/10
              transition-colors duration-150
            "
            title="Sign out"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Security badge */}
        <div className="mt-3 flex items-center gap-1.5 px-2 py-1.5 rounded-md bg-emerald-500/10 border border-emerald-500/20">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <p className="text-[9px] text-emerald-400 font-mono-custom tracking-wide uppercase">
            Secure Private Session Active
          </p>
        </div>
      </div>
    </aside>
  );
}
