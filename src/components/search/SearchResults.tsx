import { FileText, Eye, AlertTriangle, CheckCircle, CircleDot, AlertOctagon, Square } from "lucide-react";
import type { DocumentResult, IntelResult } from "@/hooks/use-document-search";

interface SearchResultsProps {
  documentResults: DocumentResult[];
  intelResults: IntelResult[];
  query: string;
  onViewPage: (result: DocumentResult) => void;
}

function highlightText(text: string, query: string) {
  if (!query.trim()) return text;
  const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"));
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase() ? (
      <span key={i} className="text-primary bg-primary/20 px-0.5">{part}</span>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

const statusConfig: Record<string, { icon: typeof CheckCircle; color: string }> = {
  verified: { icon: CheckCircle, color: "text-emerald-400" },
  disputed: { icon: AlertOctagon, color: "text-amber-400" },
  unverified: { icon: CircleDot, color: "text-slate-400" },
};

export function SearchResults({ documentResults, intelResults, query, onViewPage }: SearchResultsProps) {
  return (
    <div className="space-y-2">
      {/* Document page results */}
      {documentResults.map((result) => (
        <div
          key={result.page_id}
          className="border border-border rounded-sm bg-card p-4 hover:border-primary/30 transition-all"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                <FileText className="h-3.5 w-3.5 text-primary shrink-0" />
                <span className="font-mono text-[11px] text-foreground truncate">{result.document_title}</span>
                <span className="font-mono text-[9px] text-primary bg-primary/10 px-1.5 py-0.5 rounded-sm shrink-0">
                  PAGE {result.page_number}
                </span>
                {result.has_redactions && (
                  <span className="flex items-center gap-1 font-mono text-[8px] text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded-sm shrink-0">
                    <Square className="h-2.5 w-2.5 fill-current" />
                    {result.redaction_count} REDACTED
                  </span>
                )}
              </div>
              {result.document_source && (
                <span className="font-mono text-[8px] text-muted-foreground/60 tracking-wider">
                  SOURCE: {result.document_source.toUpperCase()}
                </span>
              )}
              <p className="font-mono text-[10px] text-muted-foreground mt-1.5 line-clamp-3 leading-relaxed">
                {highlightText(
                  result.extracted_text.length > 300
                    ? result.extracted_text.slice(0, 300) + "…"
                    : result.extracted_text,
                  query
                )}
              </p>
            </div>
            <button
              onClick={() => onViewPage(result)}
              className="flex items-center gap-1 px-2 py-1.5 rounded-sm font-mono text-[9px] tracking-wider border border-primary/30 text-primary hover:bg-primary/10 transition-all shrink-0"
            >
              <Eye className="h-3 w-3" />
              VIEW
            </button>
          </div>
        </div>
      ))}

      {/* Intel entry results */}
      {intelResults.map((result) => {
        const config = statusConfig[result.fact_check_status] || statusConfig.unverified;
        const StatusIcon = config.icon;
        return (
          <div
            key={result.id}
            className="border border-border rounded-sm bg-card p-4 hover:border-primary/30 transition-all border-l-2 border-l-emerald-500/40"
          >
            <div className="flex items-start gap-3">
              <StatusIcon className={`h-4 w-4 mt-0.5 shrink-0 ${config.color}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-[8px] tracking-widest text-emerald-400">INTEL</span>
                  <span className={`font-mono text-[8px] tracking-widest ${config.color}`}>
                    {result.fact_check_status.toUpperCase()}
                  </span>
                  <span className="font-mono text-[8px] text-muted-foreground/60 tracking-wider">
                    {result.category.toUpperCase()}
                  </span>
                </div>
                <p className="font-mono text-[11px] text-foreground">{highlightText(result.title, query)}</p>
                {result.description && (
                  <p className="font-mono text-[10px] text-muted-foreground mt-1 line-clamp-2">
                    {highlightText(result.description, query)}
                  </p>
                )}
                {result.tags && result.tags.length > 0 && (
                  <div className="flex gap-1 mt-1.5 flex-wrap">
                    {result.tags.slice(0, 5).map((tag) => (
                      <span key={tag} className="font-mono text-[7px] tracking-wider text-muted-foreground bg-secondary px-1 py-0.5 rounded-sm">
                        {tag.toUpperCase()}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {documentResults.length === 0 && intelResults.length === 0 && (
        <div className="border border-border rounded-sm bg-card p-8 flex flex-col items-center justify-center">
          <AlertTriangle className="h-8 w-8 text-muted-foreground/20 mb-3" />
          <p className="font-mono text-xs text-muted-foreground tracking-wider">NO RESULTS FOUND</p>
          <p className="font-mono text-[10px] text-muted-foreground/50 mt-1">Try different keywords</p>
        </div>
      )}
    </div>
  );
}
