import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useIntelEntries, useIntelConnections, useIntelStats } from "./use-intel-data";

export function useIntelEntriesRealtime() {
  const queryClient = useQueryClient();
  const result = useIntelEntries();

  useEffect(() => {
    const channel = supabase
      .channel("intel-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "intel_entries" }, () => {
        queryClient.invalidateQueries({ queryKey: ["intel_entries"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "intel_connections" }, () => {
        queryClient.invalidateQueries({ queryKey: ["intel_connections"] });
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

  return result;
}

export function useIntelConnectionsRealtime() {
  const queryClient = useQueryClient();
  const result = useIntelConnections();

  useEffect(() => {
    const channel = supabase
      .channel("intel-connections-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "intel_connections" }, () => {
        queryClient.invalidateQueries({ queryKey: ["intel_connections"] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return result;
}

export function useIntelStatsRealtime() {
  const queryClient = useQueryClient();
  const result = useIntelStats();

  useEffect(() => {
    const channel = supabase
      .channel("intel-stats-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "intel_entries" }, () => {
        queryClient.invalidateQueries({ queryKey: ["intel_entries"] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return result;
}
