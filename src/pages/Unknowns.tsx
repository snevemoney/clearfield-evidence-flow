import { useState } from "react";
import { HelpCircle, AlertTriangle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { useRealtimeInvalidation } from "@/hooks/use-intel-realtime";

const CATEGORIES = [
  { value: "known_fact", label: "KNOWN FACTS", color: "text-success border-success/30 bg-success/10" },
  { value: "disputed_claim", label: "DISPUTED CLAIMS", color: "text-destructive border-destructive/30 bg-destructive/10" },
  { value: "unknown", label: "UNKNOWNS", color: "text-accent border-accent/30 bg-accent/10" },
  { value: "missing_document", label: "MISSING DOCUMENTS", color: "text-yellow-400 border-yellow-400/30 bg-yellow-400/10" },
  { value: "redaction", label: "REDACTIONS", color: "text-muted-foreground border-border bg-muted" },
  { value: "open_question", label: "OPEN QUESTIONS", color: "text-primary border-primary/30 bg-primary/10" },
];

function getCategoryStyle(cat: string) {
  return CATEGORIES.find((c) => c.value === cat)?.color || "text-muted-foreground border-border bg-muted";
}

function getCategoryLabel(cat: string) {
  return CATEGORIES.find((c) => c.value === cat)?.label || cat.toUpperCase();
}

const Unknowns = () => {
  useRealtimeInvalidation();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("open_question");
  const [filterCat, setFilterCat] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: unknowns = [], isLoading } = useQuery({
    queryKey: ["unknowns"],
    queryFn: async () => {
      const { data, error } = await supabase.from("unknowns").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const createUnknown = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("unknowns").insert({ title, description: description || null, category, generated_by: "user" });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["unknowns"] });
      setOpen(false);
      setTitle(""); setDescription(""); setCategory("open_question");
      toast({ title: "Unknown added", description: "Gap in knowledge has been recorded." });
    },
    onError: (e) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const filtered = filterCat ? unknowns.filter((u) => u.category === filterCat) : unknowns;

  const countByCategory = CATEGORIES.map((c) => ({
    ...c,
    count: unknowns.filter((u) => u.category === c.value).length,
  }));

  return (
    <div className="min-h-screen p-6 grid-bg">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <HelpCircle className="h-6 w-6 text-accent" />
          <h1 className="text-xl tracking-widest text-accent">WHAT WE DON'T KNOW</h1>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="font-mono text-xs tracking-wider gap-2">
              <Plus className="h-4 w-4" />
              ADD UNKNOWN
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle className="font-mono tracking-widest text-accent">RECORD UNKNOWN</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="font-mono text-xs tracking-wider">TITLE</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What's missing or unknown..." className="font-mono text-sm mt-1" />
              </div>
              <div>
                <Label className="font-mono text-xs tracking-wider">DESCRIPTION</Label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Additional context..." className="font-mono text-sm mt-1" />
              </div>
              <div>
                <Label className="font-mono text-xs tracking-wider">CATEGORY</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="font-mono text-xs mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value} className="font-mono text-xs">{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={() => createUnknown.mutate()} disabled={!title || createUnknown.isPending} className="w-full font-mono text-xs tracking-wider">
                {createUnknown.isPending ? "RECORDING..." : "RECORD UNKNOWN"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <p className="font-mono text-[10px] text-muted-foreground tracking-wider mb-6">
        MANDATORY PANEL — Gaps in knowledge are features, not bugs.
      </p>

      {/* Category summary */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 mb-6">
        {countByCategory.map((c) => (
          <button
            key={c.value}
            onClick={() => setFilterCat(filterCat === c.value ? null : c.value)}
            className={`border rounded-sm p-3 text-center transition-all ${filterCat === c.value ? c.color : "border-border bg-card hover:border-accent/30"}`}
          >
            <div className="font-mono text-lg font-bold text-foreground">{c.count}</div>
            <div className="font-mono text-[9px] tracking-wider text-muted-foreground">{c.label}</div>
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[200px]">
          <p className="font-mono text-xs text-muted-foreground animate-pulse">LOADING...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="border border-border rounded-sm bg-card p-8 flex flex-col items-center justify-center min-h-[200px]">
          <AlertTriangle className="h-8 w-8 text-muted-foreground/20 mb-3" />
          <p className="font-mono text-xs text-muted-foreground tracking-wider">NO ENTRIES{filterCat ? " IN THIS CATEGORY" : ""}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((u) => (
            <div key={u.id} className="border border-border rounded-sm bg-card p-4 border-l-2 border-l-accent/40 hover:border-l-accent transition-all">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`font-mono text-[10px] tracking-wider uppercase px-2 py-0.5 rounded-sm border ${getCategoryStyle(u.category)}`}>
                      {getCategoryLabel(u.category)}
                    </span>
                    <span className={`font-mono text-[10px] tracking-wider px-2 py-0.5 rounded-sm border ${u.generated_by === "ai" ? "border-primary/30 text-primary" : u.generated_by === "bridge_import" ? "border-success/30 text-success" : "border-border text-muted-foreground"}`}>
                      {u.generated_by === "bridge_import" ? "IMPORT" : u.generated_by.toUpperCase()}
                    </span>
                  </div>
                  <h3 className="font-mono text-sm text-foreground mb-1">{u.title}</h3>
                  {u.description && <p className="font-mono text-xs text-muted-foreground">{u.description}</p>}
                </div>
                <span className="font-mono text-[10px] text-muted-foreground/50 shrink-0">{new Date(u.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Unknowns;
