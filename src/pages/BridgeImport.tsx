import { useState } from "react";
import { Import, Link2, Loader2, CheckCircle, AlertTriangle, HelpCircle, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface ImportResult {
  url?: string;
  source_label?: string;
  status: "success" | "error";
  evidence_title?: string;
  evidence_id?: string;
  intel_entry_id?: string;
  timeline_event_id?: string;
  unknowns_generated?: string[];
  error?: string;
}

const MAX_TEXT_LENGTH = 10000;

const BridgeImport = () => {
  const [urlText, setUrlText] = useState("");
  const [pasteText, setPasteText] = useState("");
  const [sourceLabel, setSourceLabel] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ImportResult[]>([]);

  const handleUrlImport = async () => {
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

  const handleTextImport = async () => {
    const trimmed = pasteText.trim();
    if (trimmed.length === 0) {
      toast({ title: "No text provided", description: "Paste your chat transcript into the text area.", variant: "destructive" });
      return;
    }
    if (trimmed.length > MAX_TEXT_LENGTH) {
      toast({ title: "Text too long", description: `Max ${MAX_TEXT_LENGTH.toLocaleString()} characters per submission.`, variant: "destructive" });
      return;
    }

    setLoading(true);
    setResults([]);

    try {
      const { data, error } = await supabase.functions.invoke("bridge-import", {
        body: { texts: [{ content: trimmed, source_label: sourceLabel.trim() || undefined }] },
      });

      if (error) throw error;
      setResults(data.results || []);

      const successCount = data.results?.filter((r: ImportResult) => r.status === "success").length || 0;
      toast({ title: "Import complete", description: `${successCount} item(s) extracted from transcript.` });
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
        PASTE URLS OR RAW CHAT TRANSCRIPTS — CLEARFIELD EXTRACTS, ARCHIVES, AND GENERATES QUESTIONS
      </p>

      <Tabs defaultValue="url" className="mb-6">
        <TabsList className="font-mono text-xs tracking-wider mb-4">
          <TabsTrigger value="url" className="gap-2"><Link2 className="h-3.5 w-3.5" />URL MODE</TabsTrigger>
          <TabsTrigger value="text" className="gap-2"><FileText className="h-3.5 w-3.5" />TEXT MODE</TabsTrigger>
        </TabsList>

        <TabsContent value="url">
          <div className="border border-border rounded-sm bg-card p-6">
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
              <Button onClick={handleUrlImport} disabled={loading} className="font-mono text-xs tracking-wider gap-2">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Import className="h-4 w-4" />}
                {loading ? "PROCESSING..." : "IMPORT & EXTRACT"}
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="text">
          <div className="border border-border rounded-sm bg-card p-6">
            <Input
              value={sourceLabel}
              onChange={(e) => setSourceLabel(e.target.value)}
              placeholder="Source label (e.g. thewebb.io — Epstein Saudi Arabia research)"
              className="font-mono text-sm mb-4 bg-background"
            />
            <Textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value.slice(0, MAX_TEXT_LENGTH))}
              placeholder={"Paste your chat transcript here...\n\nThe AI will extract evidence objects, intel entries,\ntimeline events, and open questions from the text."}
              className="font-mono text-sm min-h-[300px] mb-4 bg-background"
            />
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] text-muted-foreground">
                {pasteText.length.toLocaleString()} / {MAX_TEXT_LENGTH.toLocaleString()} characters
              </span>
              <Button onClick={handleTextImport} disabled={loading} className="font-mono text-xs tracking-wider gap-2">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Import className="h-4 w-4" />}
                {loading ? "PROCESSING..." : "IMPORT & EXTRACT"}
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>

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
                  <p className="font-mono text-xs text-muted-foreground truncate mb-1">
                    {r.url || r.source_label || "Text import"}
                  </p>
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
