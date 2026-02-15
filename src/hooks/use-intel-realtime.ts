import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useIntelEntries, useIntelConnections, useIntelStats } from "./use-intel-data";

export function useRealtimeInvalidation() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel("intel-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "intel_entries" }, () => {
        queryClient.invalidateQueries({ queryKey: ["intel_entries"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "documents" }, () => {
        queryClient.invalidateQueries({ queryKey: ["documents"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "document_pages" }, () => {
        queryClient.invalidateQueries({ queryKey: ["document_pages"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "evidence" }, () => {
        queryClient.invalidateQueries({ queryKey: ["evidence"] });
        queryClient.invalidateQueries({ queryKey: ["evidence_list"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "unknowns" }, () => {
        queryClient.invalidateQueries({ queryKey: ["unknowns"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "timeline_events" }, () => {
        queryClient.invalidateQueries({ queryKey: ["timeline_events"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "contradictions" }, () => {
        queryClient.invalidateQueries({ queryKey: ["contradictions"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "claims" }, () => {
        queryClient.invalidateQueries({ queryKey: ["claims"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "claim_evidence" }, () => {
        queryClient.invalidateQueries({ queryKey: ["claim_evidence"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "context_notes" }, () => {
        queryClient.invalidateQueries({ queryKey: ["context_notes"] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}

export function useIntelEntriesRealtime() {
  useRealtimeInvalidation();
  return useIntelEntries();
}

export function useIntelConnectionsRealtime() {
  useRealtimeInvalidation();
  return useIntelConnections();
}

export function useIntelStatsRealtime() {
  useRealtimeInvalidation();
  return useIntelStats();
}
