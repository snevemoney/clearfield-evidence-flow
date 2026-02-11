import { useState } from "react";
import { motion } from "framer-motion";
import { Brain, Zap, Search, FileText, Twitter, RefreshCw, CheckCircle, AlertTriangle, XCircle, Clock, Database, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";

const EPSTEIN_QUERIES = [
  "Jeffrey Epstein associates flight logs Lolita Express",
  "Ghislaine Maxwell trial documents evidence",
  "Epstein island Little St James visitors",
  "Jeffrey Epstein financial connections banks",
  "Epstein case court filings SDNY",
  "Jeffrey Epstein intelligence connections",
  "Epstein victim testimony public records",
  "JP Morgan Epstein Deutsche Bank lawsuits",
  "Epstein black book contacts",
  "Jeffrey Epstein death investigation findings",
];

const statusIcon = (status: string) => {
  switch (status) {
    case "verified": return <CheckCircle className="h-3 w-3 text-green-400" />;
    case "disputed": return <AlertTriangle className="h-3 w-3 text-yellow-400" />;
    case "debunked": return <XCircle className="h-3 w-3 text-red-400" />;
    default: return <Clock className="h-3 w-3 text-muted-foreground" />;
  }
};

const IntelligenceHub = () => {
  const [customTopic, setCustomTopic] = useState("");
  const queryClient = useQueryClient();

  const { data: entries = [] } = useQuery({
    queryKey: ["intel-entries"],
    queryFn: async () => {
      const { data } = await supabase
        .from("intel_entries")
        .select("*")
        .order("ingested_at", { ascending: false })
        .limit(50);
      return data || [];
    },
  });

  const { data: runs = [] } = useQuery({
    queryKey: ["ingestion-runs"],
    queryFn: async () => {
      const { data } = await supabase
        .from("ingestion_runs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);
      return data || [];
    },
  });

  const { data: connections = [] } = useQuery({
    queryKey: ["intel-connections"],
    queryFn: async () => {
      const { data } = await supabase
        .from("intel_connections")
        .select("*")
        .limit(100);
      return data || [];
    },
  });

  const ingestMutation = useMutation({
    mutationFn: async ({ fn, topic }: { fn: string; topic: string }) => {
      const { data, error } = await supabase.functions.invoke(fn, {
        body: { topic },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data, vars) => {
      toast({ title: "Ingestion complete", description: `${vars.fn}: ${data.entries_added || 0} entries added` });
      queryClient.invalidateQueries({ queryKey: ["intel-entries"] });
      queryClient.invalidateQueries({ queryKey: ["ingestion-runs"] });
    },
    onError: (err: any) => {
      toast({ title: "Ingestion failed", description: err.message, variant: "destructive" });
    },
  });

  const processMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("process-intelligence", { body: {} });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast({ title: "Processing complete", description: `${data.connections_added || 0} connections found` });
      queryClient.invalidateQueries({ queryKey: ["intel-connections"] });
    },
    onError: (err: any) => {
      toast({ title: "Processing failed", description: err.message, variant: "destructive" });
    },
  });

  const factCheckMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("fact-check", { body: {} });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast({ title: "Fact-check complete", description: `${data.entries_checked || 0} entries checked` });
      queryClient.invalidateQueries({ queryKey: ["intel-entries"] });
    },
    onError: (err: any) => {
      toast({ title: "Fact-check failed", description: err.message, variant: "destructive" });
    },
  });

  const runAllEpstein = async () => {
    for (const query of EPSTEIN_QUERIES.slice(0, 3)) {
      await ingestMutation.mutateAsync({ fn: "ingest-news", topic: query });
    }
    await ingestMutation.mutateAsync({ fn: "ingest-twitter", topic: "Jeffrey Epstein" });
    await ingestMutation.mutateAsync({ fn: "ingest-documents", topic: "Jeffrey Epstein court documents" });
    await processMutation.mutateAsync();
  };

  const isLoading = ingestMutation.isPending || processMutation.isPending || factCheckMutation.isPending;

  const categoryCounts = entries.reduce((acc: Record<string, number>, e: any) => {
    acc[e.category] = (acc[e.category] || 0) + 1;
    return acc;
  }, {});

  const statusCounts = entries.reduce((acc: Record<string, number>, e: any) => {
    acc[e.fact_check_status] = (acc[e.fact_check_status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="min-h-screen p-6 grid-bg">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Brain className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold tracking-widest text-primary text-glow-cyan">INTELLIGENCE HUB</h1>
        </div>
        <p className="font-mono text-xs tracking-wider text-muted-foreground">
          AI-POWERED DATA INGESTION & FACT-CHECKING — Ingest from news, Twitter/X, and court documents
        </p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: "TOTAL ENTRIES", value: entries.length, icon: Database, color: "text-primary" },
          { label: "CONNECTIONS", value: connections.length, icon: Activity, color: "text-green-400" },
          { label: "VERIFIED", value: statusCounts["verified"] || 0, icon: CheckCircle, color: "text-green-400" },
          { label: "UNVERIFIED", value: statusCounts["unverified"] || 0, icon: Clock, color: "text-yellow-400" },
        ].map((s) => (
          <div key={s.label} className="border border-border rounded-sm bg-card p-4">
            <div className="flex items-center justify-between mb-2">
              <s.icon className={`h-4 w-4 ${s.color}`} />
              <span className="font-mono text-[9px] tracking-widest text-muted-foreground">{s.label}</span>
            </div>
            <div className={`font-mono text-2xl font-bold ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Ingestion Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="border border-border rounded-sm bg-card p-4">
          <h2 className="font-mono text-xs tracking-widest text-primary mb-4 flex items-center gap-2">
            <Zap className="h-4 w-4" /> QUICK INGEST
          </h2>
          <div className="space-y-2">
            <Button
              onClick={() => runAllEpstein()}
              disabled={isLoading}
              className="w-full font-mono text-xs tracking-wider"
              variant="default"
            >
              {isLoading ? <RefreshCw className="h-3 w-3 animate-spin mr-2" /> : <Brain className="h-3 w-3 mr-2" />}
              INGEST EPSTEIN NETWORK (FULL)
            </Button>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={isLoading}
                onClick={() => ingestMutation.mutate({ fn: "ingest-news", topic: "Jeffrey Epstein" })}
                className="font-mono text-[10px]"
              >
                <Search className="h-3 w-3 mr-1" /> NEWS
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={isLoading}
                onClick={() => ingestMutation.mutate({ fn: "ingest-twitter", topic: "Jeffrey Epstein" })}
                className="font-mono text-[10px]"
              >
                <Twitter className="h-3 w-3 mr-1" /> TWITTER
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={isLoading}
                onClick={() => ingestMutation.mutate({ fn: "ingest-documents", topic: "Jeffrey Epstein court documents" })}
                className="font-mono text-[10px]"
              >
                <FileText className="h-3 w-3 mr-1" /> DOCS
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={isLoading}
                onClick={() => processMutation.mutate()}
                className="font-mono text-[10px]"
              >
                <RefreshCw className="h-3 w-3 mr-1" /> PROCESS LINKS
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={isLoading}
                onClick={() => factCheckMutation.mutate()}
                className="font-mono text-[10px]"
              >
                <CheckCircle className="h-3 w-3 mr-1" /> FACT-CHECK
              </Button>
            </div>
          </div>
        </div>

        <div className="border border-border rounded-sm bg-card p-4">
          <h2 className="font-mono text-xs tracking-widest text-primary mb-4 flex items-center gap-2">
            <Search className="h-4 w-4" /> CUSTOM TOPIC
          </h2>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={customTopic}
              onChange={(e) => setCustomTopic(e.target.value)}
              placeholder="Enter topic to investigate..."
              className="flex-1 bg-secondary border border-border rounded-sm px-3 py-2 font-mono text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
            />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={isLoading || !customTopic}
              onClick={() => ingestMutation.mutate({ fn: "ingest-news", topic: customTopic })}
              className="font-mono text-[10px]"
            >
              NEWS
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={isLoading || !customTopic}
              onClick={() => ingestMutation.mutate({ fn: "ingest-twitter", topic: customTopic })}
              className="font-mono text-[10px]"
            >
              TWITTER
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={isLoading || !customTopic}
              onClick={() => ingestMutation.mutate({ fn: "ingest-documents", topic: customTopic })}
              className="font-mono text-[10px]"
            >
              DOCUMENTS
            </Button>
          </div>

          {/* Category breakdown */}
          <div className="mt-4 pt-3 border-t border-border">
            <span className="font-mono text-[9px] tracking-widest text-muted-foreground">BY CATEGORY</span>
            <div className="flex flex-wrap gap-2 mt-2">
              {Object.entries(categoryCounts).map(([cat, count]) => (
                <span key={cat} className="font-mono text-[10px] px-2 py-0.5 rounded-sm bg-secondary border border-border text-muted-foreground">
                  {cat.toUpperCase()}: {count}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Entries & Run History */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 border border-border rounded-sm bg-card">
          <div className="flex items-center gap-2 border-b border-border px-4 py-3">
            <Database className="h-4 w-4 text-primary" />
            <h2 className="font-mono text-xs tracking-widest text-primary">RECENT INTEL</h2>
            <span className="ml-auto font-mono text-[10px] text-muted-foreground">{entries.length} ENTRIES</span>
          </div>
          <div className="max-h-[500px] overflow-y-auto">
            {entries.length === 0 ? (
              <div className="p-6 text-center">
                <Brain className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="font-mono text-xs text-muted-foreground">No entries yet. Run an ingestion above.</p>
              </div>
            ) : (
              entries.map((entry: any) => (
                <div key={entry.id} className="border-b border-border px-4 py-3 hover:bg-secondary/30 transition-colors">
                  <div className="flex items-start gap-2">
                    {statusIcon(entry.fact_check_status)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs font-medium text-foreground truncate">{entry.title}</span>
                        <span className="font-mono text-[9px] px-1.5 py-0.5 rounded-sm bg-secondary border border-border text-muted-foreground shrink-0">
                          {entry.category?.toUpperCase()}
                        </span>
                      </div>
                      <p className="font-mono text-[10px] text-muted-foreground line-clamp-2">{entry.ai_summary || entry.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="font-mono text-[9px] text-muted-foreground/60">{entry.source_type?.toUpperCase()}</span>
                        <span className="font-mono text-[9px] text-muted-foreground/60">CRED: {entry.credibility_score}</span>
                        {entry.tags?.slice(0, 3).map((t: string) => (
                          <span key={t} className="font-mono text-[8px] px-1 rounded bg-primary/10 text-primary">{t}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="border border-border rounded-sm bg-card">
          <div className="flex items-center gap-2 border-b border-border px-4 py-3">
            <Activity className="h-4 w-4 text-primary" />
            <h2 className="font-mono text-xs tracking-widest text-primary">RUN HISTORY</h2>
          </div>
          <div className="max-h-[500px] overflow-y-auto">
            {runs.length === 0 ? (
              <div className="p-6 text-center">
                <Clock className="h-6 w-6 text-muted-foreground/30 mx-auto mb-2" />
                <p className="font-mono text-[10px] text-muted-foreground">No runs yet</p>
              </div>
            ) : (
              runs.map((run: any) => (
                <div key={run.id} className="border-b border-border px-4 py-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`h-1.5 w-1.5 rounded-full ${run.status === "completed" ? "bg-green-400" : run.status === "running" ? "bg-yellow-400 animate-pulse" : "bg-red-400"}`} />
                    <span className="font-mono text-[10px] tracking-wider text-foreground">{run.source_type?.toUpperCase()}</span>
                  </div>
                  <p className="font-mono text-[9px] text-muted-foreground truncate">{run.query}</p>
                  <p className="font-mono text-[9px] text-muted-foreground/60 mt-1">
                    +{run.entries_added || 0} entries • {new Date(run.created_at).toLocaleString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default IntelligenceHub;
