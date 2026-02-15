import { useState } from "react";
import { FileText, Plus, ExternalLink, Link2, Tag } from "lucide-react";
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

const LABELS = [
  { value: "alleged", color: "text-yellow-400 border-yellow-400/30 bg-yellow-400/10" },
  { value: "unsupported", color: "text-muted-foreground border-border bg-muted" },
  { value: "disputed", color: "text-destructive border-destructive/30 bg-destructive/10" },
  { value: "verified", color: "text-success border-success/30 bg-success/10" },
  { value: "retracted", color: "text-red-500 border-red-500/30 bg-red-500/10" },
];

function getLabelStyle(label: string) {
  return LABELS.find((l) => l.value === label)?.color || "text-muted-foreground border-border bg-muted";
}

const Claims = () => {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [label, setLabel] = useState("alleged");
  const [filterLabel, setFilterLabel] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: claims = [], isLoading } = useQuery({
    queryKey: ["claims"],
    queryFn: async () => {
      const { data, error } = await supabase.from("claims").select("*").order("created_at", { ascending: false });
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

  const createClaim = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("claims").insert({ title, content, label, status: label === "verified" ? "supported" : "unsupported" });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["claims"] });
      setOpen(false);
      setTitle("");
      setContent("");
      setLabel("alleged");
      toast({ title: "Claim filed", description: "New claim has been recorded." });
    },
    onError: (e) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const evidenceCount = (claimId: string) => claimEvidence.filter((ce) => ce.claim_id === claimId).length;

  const filtered = filterLabel ? claims.filter((c) => c.label === filterLabel) : claims;

  return (
    <div className="min-h-screen p-6 grid-bg">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <FileText className="h-6 w-6 text-primary" />
          <h1 className="text-xl tracking-widest text-primary text-glow-cyan">CLAIMS</h1>
          <span className="font-mono text-[10px] text-muted-foreground border border-border px-2 py-0.5 rounded-sm">{claims.length} FILED</span>
        </div>
        <div className="flex items-center gap-2">
          <CitationExport type="claims" />
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="font-mono text-xs tracking-wider gap-2">
                <Plus className="h-4 w-4" />
                NEW CLAIM
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader>
                <DialogTitle className="font-mono tracking-widest text-primary">FILE NEW CLAIM</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label className="font-mono text-xs tracking-wider">TITLE</Label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Claim title..." className="font-mono text-sm mt-1" />
                </div>
                <div>
                  <Label className="font-mono text-xs tracking-wider">CONTENT</Label>
                  <Textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Describe the claim in detail..." className="font-mono text-sm mt-1 min-h-[120px]" />
                </div>
                <div>
                  <Label className="font-mono text-xs tracking-wider">LABEL</Label>
                  <Select value={label} onValueChange={setLabel}>
                    <SelectTrigger className="font-mono text-xs mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LABELS.map((l) => (
                        <SelectItem key={l.value} value={l.value} className="font-mono text-xs uppercase">{l.value}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={() => createClaim.mutate()} disabled={!title || !content || createClaim.isPending} className="w-full font-mono text-xs tracking-wider">
                  {createClaim.isPending ? "FILING..." : "FILE CLAIM"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <button onClick={() => setFilterLabel(null)} className={`font-mono text-[10px] tracking-wider px-3 py-1 rounded-sm border transition-all ${!filterLabel ? "border-primary text-primary bg-primary/10" : "border-border text-muted-foreground hover:text-foreground"}`}>
          ALL
        </button>
        {LABELS.map((l) => (
          <button key={l.value} onClick={() => setFilterLabel(l.value)} className={`font-mono text-[10px] tracking-wider px-3 py-1 rounded-sm border transition-all uppercase ${filterLabel === l.value ? l.color : "border-border text-muted-foreground hover:text-foreground"}`}>
            {l.value}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <p className="font-mono text-xs text-muted-foreground animate-pulse">LOADING CLAIMS...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="border border-border rounded-sm bg-card p-8 flex flex-col items-center justify-center min-h-[400px]">
          <FileText className="h-12 w-12 text-muted-foreground/20 mb-4" />
          <p className="font-mono text-xs text-muted-foreground tracking-wider">NO CLAIMS FILED</p>
          <p className="font-mono text-[10px] text-muted-foreground/50 mt-1">
            Claims are user statements — not facts. Each requires evidence or is marked unsupported.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((claim) => {
            const evCount = evidenceCount(claim.id);
            return (
              <div key={claim.id} className="border border-border rounded-sm bg-card p-4 hover:border-primary/30 transition-all">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`font-mono text-[10px] tracking-wider uppercase px-2 py-0.5 rounded-sm border ${getLabelStyle(claim.label)}`}>
                        {claim.label}
                      </span>
                      {evCount > 0 && (
                        <span className="font-mono text-[10px] text-success flex items-center gap-1">
                          <Link2 className="h-3 w-3" />{evCount} EVIDENCE
                        </span>
                      )}
                      {evCount === 0 && (
                        <span className="font-mono text-[10px] text-muted-foreground/50">UNSUPPORTED</span>
                      )}
                    </div>
                    <h3 className="font-mono text-sm text-foreground mb-1">{claim.title}</h3>
                    <p className="font-mono text-xs text-muted-foreground line-clamp-2">{claim.content}</p>
                  </div>
                  <span className="font-mono text-[10px] text-muted-foreground/50 shrink-0">
                    {new Date(claim.created_at).toLocaleDateString()}
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

export default Claims;
