import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Clock, CheckCircle, AlertTriangle, Loader2, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";

export function ImportHistory() {
  const { data: runs, isLoading } = useQuery({
    queryKey: ["ingestion_runs", "bridge_import"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ingestion_runs")
        .select("*")
        .eq("source_type", "bridge_import")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
    refetchInterval: 10000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!runs || runs.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="font-mono text-xs text-muted-foreground tracking-wider">NO IMPORT HISTORY YET</p>
      </div>
    );
  }

  const statusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-success shrink-0" />;
      case "failed":
        return <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />;
      case "running":
        return <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground shrink-0" />;
    }
  };

  return (
    <ScrollArea className="h-[400px]">
      <div className="space-y-2">
        {runs.map((run) => {
          const isUrl = run.query.startsWith("URLs:");
          const displayQuery = run.query.length > 80 ? run.query.slice(0, 80) + "…" : run.query;

          return (
            <div
              key={run.id}
              className={`border rounded-sm p-3 transition-colors ${
                run.status === "completed"
                  ? "border-success/20 bg-success/5 hover:bg-success/10"
                  : run.status === "failed"
                  ? "border-destructive/20 bg-destructive/5 hover:bg-destructive/10"
                  : "border-border bg-card hover:bg-secondary/50"
              }`}
            >
              <div className="flex items-start gap-3">
                {statusIcon(run.status)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-mono text-[10px] tracking-wider text-muted-foreground uppercase">
                      {isUrl ? "URL IMPORT" : "TEXT IMPORT"}
                    </span>
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {format(new Date(run.created_at), "MMM d, yyyy · HH:mm")}
                    </span>
                  </div>
                  <p className="font-mono text-xs text-foreground truncate">{displayQuery}</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {run.entries_found || 0} found
                    </span>
                    <span className="font-mono text-[10px] text-success">
                      {run.entries_added || 0} added
                    </span>
                    {run.error_message && (
                      <span className="font-mono text-[10px] text-destructive truncate max-w-[200px]">
                        {run.error_message}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}
