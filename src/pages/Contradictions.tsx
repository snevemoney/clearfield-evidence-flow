import { useState } from "react";
import { GitCompare, Loader2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useRealtimeInvalidation } from "@/hooks/use-intel-realtime";

const Contradictions = () => {
  useRealtimeInvalidation();
  const [scanning, setScanning] = useState(false);
  const [topicFilter, setTopicFilter] = useState("");

  const { data: contradictions = [], isLoading, refetch } = useQuery({
    queryKey: ["contradictions"],
    queryFn: async () => {
      const { data, error } = await supabase.from("contradictions").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: entries = [] } = useQuery({
    queryKey: ["intel_entries"],
    queryFn: async () => {
      const { data, error } = await supabase.from("intel_entries").select("id, title, source_type, source_url");
      if (error) throw error;
      return data;
    },
  });

  const entryMap = Object.fromEntries(entries.map((e) => [e.id, e]));

  const runScan = async () => {
    setScanning(true);
    try {
      const { data, error } = await supabase.functions.invoke("find-contradictions", {
        body: topicFilter ? { topic: topicFilter } : {},
      });
      if (error) throw error;
      const count = data?.contradictions?.length || 0;
      toast({ title: "Scan complete", description: `${count} contradiction${count !== 1 ? "s" : ""} detected.` });
      refetch();
    } catch (e) {
      toast({ title: "Scan failed", description: e instanceof Error ? e.message : "Unknown error", variant: "destructive" });
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="min-h-screen p-6 grid-bg">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <GitCompare className="h-6 w-6 text-destructive" />
          <h1 className="text-xl tracking-widest text-destructive">CONTRADICTIONS</h1>
          <span className="font-mono text-[10px] text-muted-foreground border border-border px-2 py-0.5 rounded-sm">{contradictions.length} FOUND</span>
        </div>
      </div>
      <p className="font-mono text-[10px] text-muted-foreground tracking-wider mb-6">
        SOURCE A SAYS X. SOURCE B SAYS Y. NO CONCLUSIONS — JUST THE CONFLICT.
      </p>

      <div className="flex items-center gap-3 mb-6">
        <Input
          value={topicFilter}
          onChange={(e) => setTopicFilter(e.target.value)}
          placeholder="Filter by topic (optional)..."
          className="font-mono text-sm max-w-sm"
        />
        <Button onClick={runScan} disabled={scanning} className="font-mono text-xs tracking-wider gap-2">
          {scanning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
          {scanning ? "SCANNING..." : "SCAN FOR CONTRADICTIONS"}
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <p className="font-mono text-xs text-muted-foreground animate-pulse">LOADING...</p>
        </div>
      ) : contradictions.length === 0 ? (
        <div className="border border-border rounded-sm bg-card p-8 flex flex-col items-center justify-center min-h-[400px]">
          <GitCompare className="h-12 w-12 text-muted-foreground/20 mb-4" />
          <p className="font-mono text-xs text-muted-foreground tracking-wider">NO CONTRADICTIONS DETECTED</p>
          <p className="font-mono text-[10px] text-muted-foreground/50 mt-1">
            Run a scan to identify conflicting claims between sources.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {contradictions.map((c) => {
            const sourceA = entryMap[c.source_a_id];
            const sourceB = entryMap[c.source_b_id];
            return (
              <div key={c.id} className="border border-destructive/20 rounded-sm bg-card overflow-hidden">
                <div className="px-4 py-2 border-b border-border bg-destructive/5">
                  <span className="font-mono text-xs tracking-wider text-destructive">{c.topic}</span>
                  <span className="font-mono text-[10px] text-muted-foreground ml-3">
                    {c.detected_by === "ai" ? "AI-DETECTED" : "USER-FLAGGED"} · {new Date(c.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border">
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-mono text-[10px] tracking-wider text-primary bg-primary/10 border border-primary/30 px-2 py-0.5 rounded-sm">SOURCE A</span>
                      {sourceA && <span className="font-mono text-[10px] text-muted-foreground truncate">{sourceA.title}</span>}
                    </div>
                    <p className="font-mono text-xs text-foreground">{c.summary_a}</p>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-mono text-[10px] tracking-wider text-accent bg-accent/10 border border-accent/30 px-2 py-0.5 rounded-sm">SOURCE B</span>
                      {sourceB && <span className="font-mono text-[10px] text-muted-foreground truncate">{sourceB.title}</span>}
                    </div>
                    <p className="font-mono text-xs text-foreground">{c.summary_b}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Contradictions;
