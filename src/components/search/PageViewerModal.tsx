import { ChevronLeft, ChevronRight, Shield, FileText } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useDocumentPages } from "@/hooks/use-document-search";
import { useState, useEffect } from "react";

interface PageViewerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentId: string | null;
  documentTitle: string;
  documentSource: string | null;
  initialPage: number;
  searchQuery: string;
}

function highlightText(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text;
  const words = query.trim().split(/\s+/).filter(Boolean);
  const pattern = new RegExp(`(${words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "gi");
  const parts = text.split(pattern);
  return parts.map((part, i) =>
    pattern.test(part) ? (
      <mark key={i} className="bg-primary/30 text-primary px-0.5 rounded-sm">{part}</mark>
    ) : (
      part
    )
  );
}

export function PageViewerModal({
  open,
  onOpenChange,
  documentId,
  documentTitle,
  documentSource,
  initialPage,
  searchQuery,
}: PageViewerModalProps) {
  const { data: pages = [], isLoading, isError, error } = useDocumentPages(open ? documentId : null);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);

  useEffect(() => {
    if (pages.length > 0) {
      const idx = pages.findIndex((p) => p.page_number === initialPage);
      setCurrentPageIndex(idx >= 0 ? idx : 0);
    }
  }, [pages, initialPage]);

  const currentPage = pages[currentPageIndex];
  const totalPages = pages.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col bg-card border-border">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            <DialogTitle className="font-mono text-sm tracking-wider text-primary truncate">
              {documentTitle}
            </DialogTitle>
          </div>
          <DialogDescription className="flex items-center gap-2 font-mono text-[10px] tracking-wider">
            {documentSource && (
              <Badge variant="secondary" className="font-mono text-[8px] tracking-wider px-1.5 py-0 h-4 rounded-sm">
                {documentSource}
              </Badge>
            )}
            <span className="text-muted-foreground">
              {totalPages} PAGES INDEXED
            </span>
          </DialogDescription>
        </DialogHeader>

        {isError && (
          <p className="font-mono text-xs text-destructive px-1" role="alert">
            {error instanceof Error ? error.message : "Failed to load pages."}
          </p>
        )}
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <p className="font-mono text-xs text-muted-foreground animate-pulse">LOADING PAGES...</p>
          </div>
        ) : currentPage ? (
          <div className="flex-1 overflow-y-auto min-h-0">
            {/* Page header */}
            <div className="flex items-center justify-between mb-3 sticky top-0 bg-card py-2 z-10">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-mono text-[9px] tracking-wider px-2 py-0.5 rounded-sm">
                  PAGE {currentPage.page_number}
                </Badge>
                {currentPage.has_redactions && (
                  <span className="flex items-center gap-1 font-mono text-[9px] text-red-400">
                    <Shield className="h-3 w-3" />
                    {currentPage.redaction_count} REDACTIONS
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  disabled={currentPageIndex === 0}
                  onClick={() => setCurrentPageIndex((i) => i - 1)}
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                <span className="font-mono text-[9px] text-muted-foreground min-w-[60px] text-center">
                  {currentPageIndex + 1} / {totalPages}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  disabled={currentPageIndex >= totalPages - 1}
                  onClick={() => setCurrentPageIndex((i) => i + 1)}
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {/* Page content */}
            <div className="border border-border rounded-sm bg-secondary/30 p-4">
              <pre className="font-mono text-[11px] text-foreground/90 whitespace-pre-wrap leading-relaxed">
                {highlightText(currentPage.extracted_text || "[ NO TEXT EXTRACTED ]", searchQuery)}
              </pre>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center p-8">
            <p className="font-mono text-xs text-muted-foreground">NO PAGES AVAILABLE</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
