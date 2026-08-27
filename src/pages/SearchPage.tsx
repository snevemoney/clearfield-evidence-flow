import { useState } from "react";
import { Search, Database, FileText, Shield, Loader2, Zap } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SearchResults } from "@/components/search/SearchResults";
import { PageViewerModal } from "@/components/search/PageViewerModal";
import { useDocumentSearch, useArchiveStats, type FilterType, type DocSearchResult } from "@/hooks/use-document-search";
import { toast } from "@/hooks/use-toast";
import { invokeFunction } from "@/lib/invoke";
import { QueryError } from "@/components/QueryError";

const filters: { key: FilterType; label: string }[] = [
  { key: "all", label: "ALL RESULTS" },
  { key: "documents", label: "DOCUMENTS" },
  { key: "intel", label: "INTEL" },
  { key: "redacted", label: "REDACTED ONLY" },
];

const SearchPage = () => {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [seeding, setSeeding] = useState(false);

  // Page viewer modal state
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerDoc, setViewerDoc] = useState<{
    documentId: string;
    title: string;
    source: string | null;
    page: number;
  } | null>(null);

  const { docResults, intelResults, isLoading, isError, error, debouncedQuery } = useDocumentSearch(query, filter);
  const { data: stats, isError: statsError, error: statsErr, isLoading: statsLoading } = useArchiveStats();

  const handleDocClick = (result: DocSearchResult) => {
    setViewerDoc({
      documentId: result.document_id,
      title: result.document_title,
      source: result.document_source,
      page: result.page_number,
    });
    setViewerOpen(true);
  };

  const handleSeedArchive = async () => {
    setSeeding(true);
    try {
      const data = await invokeFunction<{ summary?: string }>("seed-document-archive", {});
      toast({
        title: "Archive Seeded",
        description: data?.summary || "Documents have been indexed.",
      });
    } catch (e) {
      toast({
        title: "Seed Failed",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="min-h-screen p-6 grid-bg">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Database className="h-6 w-6 text-primary" />
          <h1 className="text-xl tracking-widest text-primary text-glow-cyan">DOCUMENT ARCHIVE</h1>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleSeedArchive}
          disabled={seeding}
          className="font-mono text-[9px] tracking-wider gap-1.5"
        >
          {seeding ? <Loader2 className="h-3 w-3 animate-spin" /> : <Zap className="h-3 w-3" />}
          {seeding ? "SEEDING..." : "SEED ARCHIVE"}
        </Button>
      </div>

      {/* Stats bar */}
      <div className="flex items-center gap-4 mb-5 font-mono text-[10px] tracking-wider text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <FileText className="h-3 w-3" />
          {stats?.totalDocuments ?? "—"} DOCUMENTS
        </span>
        <span className="text-border">|</span>
        <span>{stats?.totalPages ?? "—"} PAGES</span>
        <span className="text-border">|</span>
        <span className="flex items-center gap-1">
          <Shield className="h-3 w-3 text-red-400" />
          {stats?.redactedPages ?? "—"} REDACTED
        </span>
      </div>

      {(isError || statsError) && (
        <QueryError message={(error || statsErr) instanceof Error ? (error || statsErr)!.message : "Search failed."} />
      )}
      {statsLoading && !stats && (
        <p className="font-mono text-[10px] text-muted-foreground mb-3 animate-pulse">LOADING ARCHIVE STATS...</p>
      )}

      {/* Search bar */}
      <div className="max-w-2xl mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search names, case numbers, locations..."
            className="pl-10 font-mono text-xs bg-card border-border focus:border-primary"
          />
          {isLoading && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary animate-spin" />
          )}
        </div>
      </div>

      {/* Filter chips */}
      <div className="flex items-center gap-2 mb-5">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1 rounded-sm font-mono text-[9px] tracking-wider border transition-all ${
              filter === f.key
                ? "border-primary/50 text-primary bg-primary/10"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {f.label}
          </button>
        ))}
        {debouncedQuery && (
          <span className="ml-2 font-mono text-[9px] text-muted-foreground/60">
            {docResults.length + intelResults.length} RESULTS
          </span>
        )}
      </div>

      {/* Results */}
      <SearchResults
        docResults={docResults}
        intelResults={intelResults}
        query={debouncedQuery}
        onDocClick={handleDocClick}
      />

      {/* Page viewer modal */}
      <PageViewerModal
        open={viewerOpen}
        onOpenChange={setViewerOpen}
        documentId={viewerDoc?.documentId ?? null}
        documentTitle={viewerDoc?.title ?? ""}
        documentSource={viewerDoc?.source ?? null}
        initialPage={viewerDoc?.page ?? 1}
        searchQuery={debouncedQuery}
      />
    </div>
  );
};

export default SearchPage;
