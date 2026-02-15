import { useState } from "react";
import { Import, Link2, Loader2, CheckCircle, AlertTriangle, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface ImportResult {
  url: string;
  status: "success" | "error";
  evidence_title?: string;
  evidence_id?: string;
  intel_entry_id?: string;
  timeline_event_id?: string;
  unknowns_generated?: string[];
  error?: string;
}

const BridgeImport = () => {
  const [urlText, setUrlText] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ImportResult[]>([]);

  const handleImport = async () => {
    const urls = urlText
      .split(/[\n,]/)
      .map((u) => u.trim())
      .filter((u) => u.length > 0 && (u.startsWith("http://") || u.startsWith("https://")));

    if (urls.length === 0) {
      toast({ title: "No valid URLs", description: "Paste URLs starting with http:// or https://", variant: "destructive" });
      return;
    }

    setLoading(true);
    setResults([]);

    try {
      const { data, error } = await supabase.functions.invoke("bridge-import", {
        body: { urls },
      });

      if (error) throw error;
      setResults(data.results || []);

      const successCount = data.results?.filter((r: ImportResult) => r.status === "success").length || 0;
      toast({ title: "Import complete", description: `${successCount} of ${urls.length} URLs processed successfully.` });
    } catch (e) {
      toast({ title: "Import failed", description: e instanceof Error ? e.message : "Unknown error", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-6 grid-bg">
      <div className="flex items-center gap-3 mb-2">
        <Import className="h-6 w-6 text-primary" />
        <h1 className="text-xl tracking-widest text-primary text-glow-cyan">BRIDGE IMPORT</h1>
      </div>
      <p className="font-mono text-[10px] text-muted-foreground tracking-wider mb-6">
        PASTE ANY URL — CLEARFIELD EXTRACTS, ARCHIVES, AND GENERATES QUESTIONS
      </p>

      <div className="border border-border rounded-sm bg-card p-6 mb-6">
        <Textarea
          value={urlText}
          onChange={(e) => setUrlText(e.target.value)}
          placeholder={"Paste URLs here (one per line, or comma-separated)\n\nhttps://example.com/article-1\nhttps://example.com/document-2\nhttps://example.com/filing-3"}
          className="font-mono text-sm min-h-[160px] mb-4 bg-background"
        />
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] text-muted-foreground">
            {urlText.split(/[\n,]/).filter((u) => u.trim().startsWith("http")).length} URLs detected · Max 20 per batch
          </span>
          <Button onClick={handleImport} disabled={loading} className="font-mono text-xs tracking-wider gap-2">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Import className="h-4 w-4" />}
            {loading ? "PROCESSING..." : "IMPORT & EXTRACT"}
          </Button>
        </div>
      </div>

      {results.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-mono text-xs tracking-widest text-muted-foreground mb-2">IMPORT RESULTS</h2>
          {results.map((r, i) => (
            <div key={i} className={`border rounded-sm p-4 ${r.status === "success" ? "border-success/30 bg-success/5" : "border-destructive/30 bg-destructive/5"}`}>
              <div className="flex items-start gap-3">
                {r.status === "success" ? (
                  <CheckCircle className="h-5 w-5 text-success shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-xs text-muted-foreground truncate mb-1">{r.url}</p>
                  {r.status === "success" ? (
                    <>
                      <h3 className="font-mono text-sm text-foreground mb-2">{r.evidence_title}</h3>
                      <div className="flex flex-wrap gap-2 text-[10px] font-mono">
                        <span className="text-success border border-success/30 px-2 py-0.5 rounded-sm">EVIDENCE CREATED</span>
                        <span className="text-primary border border-primary/30 px-2 py-0.5 rounded-sm">INTEL ENTRY CREATED</span>
                        {r.timeline_event_id && <span className="text-accent border border-accent/30 px-2 py-0.5 rounded-sm">TIMELINE CANDIDATE</span>}
                      </div>
                      {r.unknowns_generated && r.unknowns_generated.length > 0 && (
                        <div className="mt-2 space-y-1">
                          <span className="font-mono text-[10px] text-muted-foreground tracking-wider">OPEN QUESTIONS GENERATED:</span>
                          {r.unknowns_generated.map((q, qi) => (
                            <div key={qi} className="flex items-center gap-2 ml-2">
                              <HelpCircle className="h-3 w-3 text-accent shrink-0" />
                              <span className="font-mono text-[10px] text-muted-foreground">{q}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="font-mono text-xs text-destructive">{r.error}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BridgeImport;
