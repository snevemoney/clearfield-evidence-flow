import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useIntelEntries, useIntelConnections, useIntelStats } from "./use-intel-data";

function useRealtimeInvalidation() {
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
