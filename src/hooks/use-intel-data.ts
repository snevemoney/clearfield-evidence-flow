import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface IntelEntry {
  id: string;
  title: string;
  description: string | null;
  category: string;
  source_type: string;
  source_url: string | null;
  fact_check_status: string;
  credibility_score: number | null;
  lat: number | null;
  lng: number | null;
  published_at: string | null;
  tags: string[] | null;
  related_entities: string[] | null;
  ai_summary: string | null;
  ingested_at: string;
  created_at: string;
}

export interface IntelConnection {
  id: string;
  source_entry_id: string;
  target_entry_id: string;
  connection_type: string;
  evidence_strength: string;
  description: string | null;
}

export function useIntelEntries() {
  return useQuery({
    queryKey: ["intel_entries"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("intel_entries")
        .select("*")
        .order("ingested_at", { ascending: false });
      if (error) throw error;
      return (data || []) as IntelEntry[];
    },
  });
}

export function useIntelConnections() {
  return useQuery({
    queryKey: ["intel_connections"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("intel_connections")
        .select("*");
      if (error) throw error;
      return (data || []) as IntelConnection[];
    },
  });
}

export function useIntelStats() {
  const { data: entries = [], ...rest } = useIntelEntries();

  const stats = {
    totalEntries: entries.length,
    claims: entries.filter((e) => e.category === "claim").length,
    evidence: entries.filter((e) => ["document", "evidence"].includes(e.category)).length,
    persons: entries.filter((e) => e.category === "person").length,
    verified: entries.filter((e) => e.fact_check_status === "verified").length,
    disputed: entries.filter((e) => e.fact_check_status === "disputed").length,
    unverified: entries.filter((e) => e.fact_check_status === "unverified").length,
    withLocation: entries.filter((e) => e.lat != null && e.lng != null).length,
    withDate: entries.filter((e) => e.published_at != null).length,
  };

  return { stats, entries, ...rest };
}
