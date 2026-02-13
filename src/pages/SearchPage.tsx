import { useState } from "react";
import { Search, FileText, Database, Square, Activity } from "lucide-react";
import { useDocumentSearch, useDocumentStats, type SearchFilter } from "@/hooks/use-document-search";
import { SearchResults } from "@/components/search/SearchResults";
import { PageViewerModal } from "@/components/search/PageViewerModal";
import { DocumentUpload } from "@/components/search/DocumentUpload";
import type { DocumentResult } from "@/hooks/use-document-search";

const filterOptions: { key: SearchFilter; label: string; icon: typeof FileText }[] = [
  { key: "all", label: "ALL", icon: Search },
  { key: "documents", label: "DOCUMENTS", icon: FileText },
  { key: "intel", label: "INTEL ENTRIES", icon: Database },
  { key: "redacted", label: "REDACTED ONLY", icon: Square },
];

const SearchPage = () => {
  const { query, updateQuery, filter, setFilter, documentResults, intelResults, totalCount, isLoading } = useDocumentSearch();
  const { data: stats } = useDocumentStats();
  const [viewingPage, setViewingPage] = useState<DocumentResult | null>(null);

  return (
    <div className="min-h-screen p-6 grid-bg">
      <div className="flex items-center gap-3 mb-4">
        <Search className="h-6 w-6 text-primary" />
        <h1 className="text-xl tracking-widest text-primary text-glow-cyan">SEARCH & DISCOVERY</h1>
      </div>

      {/* Stats bar */}
      {stats && (
        <div className="flex items-center gap-4 mb-4 font-mono text-[9px] text-muted-foreground tracking-wider">
          <span className="flex items-center gap-1"><FileText className="h-3 w-3" />{stats.totalDocuments} DOCS</span>
          <span>{stats.totalPages} PAGES</span>
          <span className="flex items-center gap-1 text-red-400"><Square className="h-2.5 w-2.5 fill-current" />{stats.redactedPages} REDACTED</span>
          {stats.processingCount > 0 && (
            <span className="flex items-center gap-1 text-amber-400"><Activity className="h-3 w-3 animate-pulse" />{stats.processingCount} PROCESSING</span>
          )}
          {stats.lastIngestion && (
            <span className="ml-auto">LAST INGEST: {new Date(stats.lastIngestion).toLocaleDateString()}</span>
          )}
        </div>
      )}

      {/* Upload panel */}
      <DocumentUpload />

      {/* Search bar */}
      <div className="max-w-3xl mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => updateQuery(e.target.value)}
            placeholder="Type a name, term, or phrase — instant hits across all documents..."
            className="w-full pl-10 pr-4 py-2.5 font-mono text-xs bg-card border border-border rounded-sm focus:border-primary/50 outline-none text-foreground placeholder:text-muted-foreground/40"
          />
          {isLoading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 h-3 w-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          )}
        </div>
      </div>

      {/* Filter chips */}
      <div className="flex items-center gap-2 mb-4">
        {filterOptions.map((opt) => (
          <button
            key={opt.key}
            onClick={() => setFilter(opt.key)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-sm font-mono text-[9px] tracking-wider border transition-all ${
              filter === opt.key
                ? "border-primary/40 text-primary bg-primary/10"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            <opt.icon className="h-3 w-3" />
            {opt.label}
          </button>
        ))}

        {query.trim() && (
          <span className="ml-auto font-mono text-[9px] text-muted-foreground tracking-wider">
            {totalCount} RESULT{totalCount !== 1 ? "S" : ""}
          </span>
        )}
      </div>

      {/* Results */}
      {query.trim() ? (
        <SearchResults
          documentResults={documentResults}
          intelResults={intelResults}
          query={query}
          onViewPage={setViewingPage}
        />
      ) : (
        <div className="border border-border rounded-sm bg-card p-8 flex flex-col items-center justify-center min-h-[300px]">
          <Search className="h-12 w-12 text-muted-foreground/20 mb-4" />
          <p className="font-mono text-xs text-muted-foreground tracking-wider">
            ENTER QUERY TO BEGIN SEARCH
          </p>
          <p className="font-mono text-[10px] text-muted-foreground/50 mt-1 tracking-wider">
            Searches across all ingested documents and intel entries
          </p>
        </div>
      )}

      {/* Page viewer modal */}
      <PageViewerModal result={viewingPage} onClose={() => setViewingPage(null)} />
    </div>
  );
};

export default SearchPage;
