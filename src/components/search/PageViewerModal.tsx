import { useState } from "react";
import { X, ChevronLeft, ChevronRight, Eye, EyeOff, Square } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { DocumentResult } from "@/hooks/use-document-search";

interface PageViewerModalProps {
  result: DocumentResult | null;
  onClose: () => void;
}

export function PageViewerModal({ result, onClose }: PageViewerModalProps) {
  const [showText, setShowText] = useState(true);
  const [currentPage, setCurrentPage] = useState(result?.page_number || 1);

  // Fetch all pages for this document for navigation
  const { data: allPages = [] } = useQuery({
    queryKey: ["document-pages", result?.document_id],
    queryFn: async () => {
      if (!result?.document_id) return [];
      const { data } = await supabase
        .from("document_pages")
        .select("*")
        .eq("document_id", result.document_id)
        .order("page_number", { ascending: true });
      return data || [];
    },
    enabled: !!result?.document_id,
  });

  if (!result) return null;

  const currentPageData = allPages.find((p: any) => p.page_number === currentPage) || {
    extracted_text: result.extracted_text,
    has_redactions: result.has_redactions,
    redaction_count: result.redaction_count,
    page_image_url: result.page_image_url,
    page_number: result.page_number,
  };

  const maxPage = allPages.length > 0 ? Math.max(...allPages.map((p: any) => p.page_number)) : result.page_number;
  const minPage = allPages.length > 0 ? Math.min(...allPages.map((p: any) => p.page_number)) : result.page_number;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="border border-border rounded-sm bg-card w-full max-w-3xl max-h-[90vh] mx-4 flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div className="flex items-center gap-3">
              <span className="font-mono text-[11px] text-foreground">{result.document_title}</span>
              <span className="font-mono text-[9px] text-primary bg-primary/10 px-1.5 py-0.5 rounded-sm">
                PAGE {currentPage}
              </span>
              {currentPageData.has_redactions && (
                <span className="flex items-center gap-1 font-mono text-[8px] text-red-400">
                  <Square className="h-2.5 w-2.5 fill-current" />
                  {currentPageData.redaction_count} REDACTED
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowText((v) => !v)}
                className="p-1.5 rounded-sm text-muted-foreground hover:text-foreground transition-all"
                title={showText ? "Hide text" : "Show text"}
              >
                {showText ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
              <button onClick={onClose} className="p-1.5 rounded-sm text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto p-4">
            {currentPageData.page_image_url ? (
              <div className="relative">
                <img
                  src={currentPageData.page_image_url}
                  alt={`Page ${currentPage}`}
                  className="w-full rounded-sm border border-border"
                />
                {showText && (
                  <div className="mt-4 border border-border rounded-sm bg-secondary/30 p-4">
                    <p className="font-mono text-[10px] text-muted-foreground leading-relaxed whitespace-pre-wrap">
                      {currentPageData.extracted_text}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="border border-border rounded-sm bg-secondary/20 p-6 min-h-[400px]">
                {currentPageData.has_redactions && (
                  <div className="mb-4 flex items-center gap-2 text-red-400">
                    <Square className="h-4 w-4 fill-current" />
                    <span className="font-mono text-[10px] tracking-wider">
                      {currentPageData.redaction_count} REDACTION(S) DETECTED ON THIS PAGE
                    </span>
                  </div>
                )}
                <p className="font-mono text-[11px] text-foreground/80 leading-relaxed whitespace-pre-wrap">
                  {currentPageData.extracted_text}
                </p>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <button
              onClick={() => setCurrentPage((p) => Math.max(minPage, p - 1))}
              disabled={currentPage <= minPage}
              className="flex items-center gap-1 px-2 py-1 rounded-sm font-mono text-[9px] tracking-wider border border-border text-muted-foreground hover:text-foreground disabled:opacity-30 transition-all"
            >
              <ChevronLeft className="h-3 w-3" />
              PREV
            </button>
            <span className="font-mono text-[9px] text-muted-foreground tracking-wider">
              {currentPage} / {maxPage}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(maxPage, p + 1))}
              disabled={currentPage >= maxPage}
              className="flex items-center gap-1 px-2 py-1 rounded-sm font-mono text-[9px] tracking-wider border border-border text-muted-foreground hover:text-foreground disabled:opacity-30 transition-all"
            >
              NEXT
              <ChevronRight className="h-3 w-3" />
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
