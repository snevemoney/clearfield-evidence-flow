import { FileText, Shield, Eye, AlertTriangle, CheckCircle, CircleDot } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { DocSearchResult, IntelSearchResult } from "@/hooks/use-document-search";

interface SearchResultsProps {
  docResults: DocSearchResult[];
  intelResults: IntelSearchResult[];
  query: string;
  onDocClick: (result: DocSearchResult) => void;
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

const statusConfig: Record<string, { icon: typeof CheckCircle; className: string }> = {
  verified: { icon: CheckCircle, className: "text-emerald-400 border-emerald-500/40 bg-emerald-500/10" },
  disputed: { icon: AlertTriangle, className: "text-amber-400 border-amber-500/40 bg-amber-500/10" },
  unverified: { icon: CircleDot, className: "text-slate-400 border-slate-500/40 bg-slate-500/10" },
};

export function SearchResults({ docResults, intelResults, query, onDocClick }: SearchResultsProps) {
  const hasResults = docResults.length > 0 || intelResults.length > 0;

  if (!hasResults) {
    return (
      <div className="border border-border rounded-sm bg-card p-8 flex flex-col items-center justify-center min-h-[300px]">
        <Eye className="h-12 w-12 text-muted-foreground/20 mb-4" />
        <p className="font-mono text-xs text-muted-foreground tracking-wider">
          {query ? "NO RESULTS FOUND" : "ENTER QUERY TO BEGIN SEARCH"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {/* Document results */}
      {docResults.map((result) => {
        const snippet = result.extracted_text?.slice(0, 300) || "";
        return (
          <button
            key={`${result.page_id}`}
            onClick={() => onDocClick(result)}
            className="w-full text-left border border-border rounded-sm bg-card p-4 hover:border-primary/40 hover:bg-card/90 transition-all"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <FileText className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span className="font-mono text-[11px] text-foreground font-medium truncate">
                    {highlightText(result.document_title, query)}
                  </span>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="font-mono text-[8px] tracking-wider px-1.5 py-0 h-4 rounded-sm">
                    PAGE {result.page_number}
                  </Badge>
                  {result.document_source && (
                    <Badge variant="secondary" className="font-mono text-[8px] tracking-wider px-1.5 py-0 h-4 rounded-sm">
                      {result.document_source}
                    </Badge>
                  )}
                  {result.has_redactions && (
                    <span className="flex items-center gap-1 font-mono text-[8px] text-red-400 tracking-wider">
                      <Shield className="h-3 w-3" />
                      {result.redaction_count} REDACTIONS
                    </span>
                  )}
                </div>
                <p className="font-mono text-[10px] text-muted-foreground leading-relaxed line-clamp-3">
                  {highlightText(snippet, query)}
                </p>
              </div>
              <div className="shrink-0 flex flex-col items-end gap-1">
                <div className="font-mono text-[8px] text-primary/60 tracking-wider">
                  RANK {(result.rank * 100).toFixed(0)}%
                </div>
              </div>
            </div>
          </button>
        );
      })}

      {/* Intel results */}
      {intelResults.map((result) => {
        const status = statusConfig[result.fact_check_status] || statusConfig.unverified;
        const StatusIcon = status.icon;
        return (
          <div
            key={result.id}
            className="border border-border rounded-sm bg-card p-4 border-l-2 border-l-accent/40"
          >
            <div className="flex items-start gap-3">
              <StatusIcon className={`h-4 w-4 mt-0.5 shrink-0 ${status.className.split(" ")[0]}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`font-mono text-[8px] tracking-widest px-1.5 py-0.5 rounded-sm border ${status.className}`}>
                    {result.fact_check_status.toUpperCase()}
                  </span>
                  <span className="font-mono text-[8px] text-muted-foreground/60 tracking-wider">
                    {result.category.toUpperCase()} // {result.source_type.toUpperCase()}
                  </span>
                </div>
                <p className="font-mono text-[11px] text-foreground">
                  {highlightText(result.title, query)}
                </p>
                {result.description && (
                  <p className="font-mono text-[10px] text-muted-foreground mt-0.5 line-clamp-2">
                    {highlightText(result.description, query)}
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
