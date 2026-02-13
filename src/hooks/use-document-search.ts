import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type DocSearchResult = {
  page_id: string;
  document_id: string;
  page_number: number;
  extracted_text: string;
  has_redactions: boolean;
  redaction_count: number;
  page_image_url: string | null;
  document_title: string;
  document_source: string;
  rank: number;
};

export type IntelSearchResult = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  fact_check_status: string;
  source_type: string;
};

export type FilterType = "all" | "documents" | "intel" | "redacted";

export function useDocumentSearch(query: string, filter: FilterType = "all") {
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const docResults = useQuery({
    queryKey: ["search_documents", debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery.trim()) return [];
      const { data, error } = await supabase.rpc("search_documents", {
        search_query: debouncedQuery,
        result_limit: 100,
      });
      if (error) throw error;
      return (data || []) as DocSearchResult[];
    },
    enabled: debouncedQuery.length > 0 && filter !== "intel",
  });

  const intelResults = useQuery({
    queryKey: ["search_intel", debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery.trim()) return [];
      const { data, error } = await supabase
        .from("intel_entries")
        .select("id, title, description, category, fact_check_status, source_type")
        .or(`title.ilike.%${debouncedQuery}%,description.ilike.%${debouncedQuery}%`)
        .limit(50);
      if (error) throw error;
      return (data || []) as IntelSearchResult[];
    },
    enabled: debouncedQuery.length > 0 && filter !== "documents",
  });

  const filteredDocs = filter === "redacted"
    ? (docResults.data || []).filter((d) => d.has_redactions)
    : docResults.data || [];

  return {
    docResults: filteredDocs,
    intelResults: filter === "documents" ? [] : intelResults.data || [],
    isLoading: docResults.isLoading || intelResults.isLoading,
    debouncedQuery,
  };
}

export function useArchiveStats() {
  return useQuery({
    queryKey: ["archive_stats"],
    queryFn: async () => {
      const [docsRes, pagesRes, redactedRes] = await Promise.all([
        supabase.from("documents").select("id", { count: "exact", head: true }),
        supabase.from("document_pages").select("id", { count: "exact", head: true }),
        supabase.from("document_pages").select("id", { count: "exact", head: true }).eq("has_redactions", true),
      ]);
      return {
        totalDocuments: docsRes.count || 0,
        totalPages: pagesRes.count || 0,
        redactedPages: redactedRes.count || 0,
      };
    },
  });
}

export function useDocumentPages(documentId: string | null) {
  return useQuery({
    queryKey: ["document_pages", documentId],
    queryFn: async () => {
      if (!documentId) return [];
      const { data, error } = await supabase
        .from("document_pages")
        .select("*")
        .eq("document_id", documentId)
        .order("page_number", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!documentId,
  });
}
