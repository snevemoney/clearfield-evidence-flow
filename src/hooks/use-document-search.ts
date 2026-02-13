import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface DocumentResult {
  page_id: string;
  document_id: string;
  page_number: number;
  extracted_text: string;
  has_redactions: boolean;
  redaction_count: number;
  page_image_url: string | null;
  document_title: string;
  document_source: string | null;
  rank: number;
}

export interface IntelResult {
  id: string;
  title: string;
  description: string | null;
  category: string;
  fact_check_status: string;
  credibility_score: number | null;
  tags: string[] | null;
  source_url: string | null;
}

export type SearchFilter = "all" | "documents" | "intel" | "redacted";

export function useDocumentSearch() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [filter, setFilter] = useState<SearchFilter>("all");
  const [debounceTimer, setDebounceTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  const updateQuery = useCallback((value: string) => {
    setQuery(value);
    if (debounceTimer) clearTimeout(debounceTimer);
    const timer = setTimeout(() => setDebouncedQuery(value), 300);
    setDebounceTimer(timer);
  }, [debounceTimer]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["document-search", debouncedQuery, filter],
    queryFn: async () => {
      if (!debouncedQuery.trim()) return { document_results: [], intel_results: [], document_count: 0, intel_count: 0 };

      const { data, error } = await supabase.functions.invoke("search-documents", {
        body: {
          query: debouncedQuery,
          limit: 50,
          has_redactions: filter === "redacted" ? true : undefined,
        },
      });

      if (error) throw error;
      return data as {
        document_results: DocumentResult[];
        intel_results: IntelResult[];
        document_count: number;
        intel_count: number;
      };
    },
    enabled: debouncedQuery.trim().length > 0,
  });

  const documentResults = filter === "intel" ? [] : (data?.document_results || []);
  const intelResults = filter === "documents" || filter === "redacted" ? [] : (data?.intel_results || []);

  return {
    query,
    updateQuery,
    filter,
    setFilter,
    documentResults,
    intelResults,
    totalCount: (data?.document_count || 0) + (data?.intel_count || 0),
    isLoading: isLoading && debouncedQuery.trim().length > 0,
    error,
  };
}

export function useDocumentStats() {
  return useQuery({
    queryKey: ["documents"],
    queryFn: async () => {
      const { data: docs } = await supabase.from("documents").select("id, status, total_pages, created_at").order("created_at", { ascending: false });
      const { count: pageCount } = await supabase.from("document_pages").select("id", { count: "exact", head: true });
      const { count: redactedCount } = await supabase.from("document_pages").select("id", { count: "exact", head: true }).eq("has_redactions", true);

      return {
        totalDocuments: docs?.length || 0,
        totalPages: pageCount || 0,
        redactedPages: redactedCount || 0,
        lastIngestion: docs?.[0]?.created_at || null,
        processingCount: docs?.filter(d => d.status === "processing").length || 0,
      };
    },
  });
}
