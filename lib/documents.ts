// lib/documents.ts
//
// DOCUMENT TYPES & STYLES
// ─────────────────────────────────────────────────────────────────────────────

export interface Document {
  id: string;
  title: string;
  subtitle: string;
  category: "IPO" | "Tax" | "Legal" | "Advisory";
  dateAdded: string;
  pageCount: number;
  pdfPath: string;
  extractedText: string;
}

// Category badge colors
export const CATEGORY_STYLES: Record<
  Document["category"],
  { bg: string; text: string }
> = {
  IPO: { bg: "bg-blue-500/15", text: "text-blue-400" },
  Tax: { bg: "bg-emerald-500/15", text: "text-emerald-400" },
  Legal: { bg: "bg-violet-500/15", text: "text-violet-400" },
  Advisory: { bg: "bg-gold-500/15", text: "text-gold-400" },
};
