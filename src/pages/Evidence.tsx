import { useState } from "react";
import { Archive, Plus, ExternalLink, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { CitationExport } from "@/components/export/CitationExport";
import { useRealtimeInvalidation } from "@/hooks/use-intel-realtime";

const SOURCE_TYPES = ["news", "court_filing", "testimony", "document", "social_media", "academic", "other"];
const CREDIBILITY = ["primary", "secondary", "tertiary"];

const Evidence = () => {
  useRealtimeInvalidation();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [sourceType, setSourceType] = useState("news");
  const [author, setAuthor] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [credibility, setCredibility] = useState("secondary");
  const [url, setUrl] = useState("");
  const [publishedDate, setPublishedDate] = useState("");
  const [filterType, setFilterType] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: evidence = [], isLoading } = useQuery({
    queryKey: ["evidence"],
    queryFn: async () => {
      const { data, error } = await supabase.from("evidence").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: claimEvidence = [] } = useQuery({
    queryKey: ["claim_evidence"],
    queryFn: async () => {
      const { data, error } = await supabase.from("claim_evidence").select("*");
      if (error) throw error;
      return data;
    },
  });

  const createEvidence = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("evidence").insert({
        title, source_type: sourceType, author: author || null, excerpt: excerpt || null,
        credibility, url: url || null, published_date: publishedDate || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["evidence"] });
      setOpen(false);
      setTitle(""); setAuthor(""); setExcerpt(""); setUrl(""); setPublishedDate("");
      setSourceType("news"); setCredibility("secondary");
      toast({ title: "Evidence submitted", description: "New evidence object has been archived." });
    },
    onError: (e) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const claimCount = (evidenceId: string) => claimEvidence.filter((ce) => ce.evidence_id === evidenceId).length;

  const filtered = filterType ? evidence.filter((e) => e.source_type === filterType) : evidence;

  return (
    <div className="min-h-screen p-6 grid-bg">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Archive className="h-6 w-6 text-success" />
          <h1 className="text-xl tracking-widest text-success">EVIDENCE ARCHIVE</h1>
          <span className="font-mono text-[10px] text-muted-foreground border border-border px-2 py-0.5 rounded-sm">{evidence.length} OBJECTS</span>
        </div>
        <div className="flex items-center gap-2">
          <CitationExport type="evidence" />
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="font-mono text-xs tracking-wider gap-2">
                <Plus className="h-4 w-4" />
                SUBMIT EVIDENCE
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="font-mono tracking-widest text-success">SUBMIT EVIDENCE OBJECT</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label className="font-mono text-xs tracking-wider">TITLE *</Label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Evidence title..." className="font-mono text-sm mt-1" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="font-mono text-xs tracking-wider">SOURCE TYPE</Label>
                    <Select value={sourceType} onValueChange={setSourceType}>
                      <SelectTrigger className="font-mono text-xs mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {SOURCE_TYPES.map((t) => <SelectItem key={t} value={t} className="font-mono text-xs uppercase">{t.replace("_", " ")}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="font-mono text-xs tracking-wider">CREDIBILITY</Label>
                    <Select value={credibility} onValueChange={setCredibility}>
                      <SelectTrigger className="font-mono text-xs mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {CREDIBILITY.map((c) => <SelectItem key={c} value={c} className="font-mono text-xs uppercase">{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label className="font-mono text-xs tracking-wider">AUTHOR</Label>
                  <Input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Author name..." className="font-mono text-sm mt-1" />
                </div>
                <div>
                  <Label className="font-mono text-xs tracking-wider">EXCERPT</Label>
                  <Textarea value={excerpt} onChange={(e) => setExcerpt(e.target.value)} placeholder="Key excerpt from source..." className="font-mono text-sm mt-1" />
                </div>
                <div>
                  <Label className="font-mono text-xs tracking-wider">SOURCE URL</Label>
                  <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." className="font-mono text-sm mt-1" />
                </div>
                <div>
                  <Label className="font-mono text-xs tracking-wider">PUBLISHED DATE</Label>
                  <Input type="date" value={publishedDate} onChange={(e) => setPublishedDate(e.target.value)} className="font-mono text-sm mt-1" />
                </div>
                <Button onClick={() => createEvidence.mutate()} disabled={!title || createEvidence.isPending} className="w-full font-mono text-xs tracking-wider">
                  {createEvidence.isPending ? "SUBMITTING..." : "SUBMIT EVIDENCE"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <button onClick={() => setFilterType(null)} className={`font-mono text-[10px] tracking-wider px-3 py-1 rounded-sm border transition-all ${!filterType ? "border-success text-success bg-success/10" : "border-border text-muted-foreground hover:text-foreground"}`}>
          ALL
        </button>
        {SOURCE_TYPES.map((t) => (
          <button key={t} onClick={() => setFilterType(t)} className={`font-mono text-[10px] tracking-wider px-3 py-1 rounded-sm border transition-all uppercase ${filterType === t ? "border-success text-success bg-success/10" : "border-border text-muted-foreground hover:text-foreground"}`}>
            {t.replace("_", " ")}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <p className="font-mono text-xs text-muted-foreground animate-pulse">LOADING EVIDENCE...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="border border-border rounded-sm bg-card p-8 flex flex-col items-center justify-center min-h-[400px]">
          <Archive className="h-12 w-12 text-muted-foreground/20 mb-4" />
          <p className="font-mono text-xs text-muted-foreground tracking-wider">NO EVIDENCE ON RECORD</p>
          <p className="font-mono text-[10px] text-muted-foreground/50 mt-1">
            Evidence objects are neutral. They store metadata — never conclusions.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((ev) => {
            const claims = claimCount(ev.id);
            return (
              <div key={ev.id} className="border border-border rounded-sm bg-card p-4 hover:border-success/30 transition-all">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-[10px] tracking-wider uppercase px-2 py-0.5 rounded-sm border border-success/30 text-success bg-success/10">
                        {ev.source_type.replace("_", " ")}
                      </span>
                      <span className={`font-mono text-[10px] tracking-wider px-2 py-0.5 rounded-sm border ${ev.credibility === "primary" ? "border-primary/30 text-primary bg-primary/10" : ev.credibility === "tertiary" ? "border-muted-foreground/30 text-muted-foreground" : "border-border text-muted-foreground"}`}>
                        {ev.credibility?.toUpperCase() || "SECONDARY"}
                      </span>
                      {claims > 0 && (
                        <span className="font-mono text-[10px] text-primary">{claims} CLAIMS</span>
                      )}
                    </div>
                    <h3 className="font-mono text-sm text-foreground mb-1">{ev.title}</h3>
                    {ev.excerpt && <p className="font-mono text-xs text-muted-foreground line-clamp-2">{ev.excerpt}</p>}
                    <div className="flex items-center gap-3 mt-2">
                      {ev.author && <span className="font-mono text-[10px] text-muted-foreground/70">{ev.author}</span>}
                      {ev.url && (
                        <a href={ev.url} target="_blank" rel="noopener noreferrer" className="font-mono text-[10px] text-primary hover:underline flex items-center gap-1">
                          <ExternalLink className="h-3 w-3" />SOURCE
                        </a>
                      )}
                    </div>
                  </div>
                  <span className="font-mono text-[10px] text-muted-foreground/50 shrink-0">
                    {ev.published_date ? new Date(ev.published_date).toLocaleDateString() : new Date(ev.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Evidence;
