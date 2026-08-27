import { useState } from "react";
import { MessageSquare, Plus, ThumbsUp, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { useRealtimeInvalidation } from "@/hooks/use-intel-realtime";
import { LIST_LIMIT } from "@/lib/constants";
import { parseContextNoteInsert, NOTE_TARGET_TYPES } from "@/lib/validation";
import { QueryError } from "@/components/QueryError";

const TARGET_TYPES = [...NOTE_TARGET_TYPES];

export function ContextNotesPanel() {
  useRealtimeInvalidation();
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState("");
  const [targetType, setTargetType] = useState("claim");
  const [targetId, setTargetId] = useState("");
  const [evidenceId, setEvidenceId] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "usefulness">("date");
  const queryClient = useQueryClient();

  const { data: notes = [], isLoading, isError, error } = useQuery({
    queryKey: ["context_notes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("context_notes").select("*").order("created_at", { ascending: false }).limit(LIST_LIMIT);
      if (error) throw error;
      return data;
    },
  });

  const { data: evidenceList = [], isError: evidenceError, error: evidenceErr, isLoading: evidenceLoading } = useQuery({
    queryKey: ["evidence_list"],
    queryFn: async () => {
      const { data, error } = await supabase.from("evidence").select("id, title").limit(LIST_LIMIT);
      if (error) throw error;
      return data;
    },
  });

  const createNote = useMutation({
    mutationFn: async () => {
      const payload = parseContextNoteInsert({
        content,
        target_type: targetType,
        target_id: targetId,
        evidence_id: evidenceId || null,
      });
      const { error } = await supabase.from("context_notes").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["context_notes"] });
      setOpen(false); setContent(""); setTargetId(""); setEvidenceId("");
      toast({ title: "Note added", description: "Context note has been recorded." });
    },
    onError: (e) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const sorted = [...notes].sort((a, b) => {
    if (sortBy === "usefulness") return (b.usefulness_score || 0) - (a.usefulness_score || 0);
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <span className="font-mono text-[10px] text-muted-foreground border border-border px-2 py-0.5 rounded-sm">{notes.length} NOTES</span>
          <button onClick={() => setSortBy(sortBy === "date" ? "usefulness" : "date")} className="font-mono text-[10px] tracking-wider px-3 py-1 rounded-sm border border-border text-muted-foreground hover:text-foreground transition-all">SORT: {sortBy === "date" ? "DATE" : "USEFULNESS"}</button>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="font-mono text-xs tracking-wider gap-2"><Plus className="h-4 w-4" />ADD NOTE</Button></DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader><DialogTitle className="font-mono tracking-widest text-primary">ADD CONTEXT NOTE</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label className="font-mono text-xs tracking-wider">NOTE CONTENT *</Label><Textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Your context note — must cite evidence..." className="font-mono text-sm mt-1 min-h-[120px]" /></div>
              <div><Label className="font-mono text-xs tracking-wider">TARGET TYPE</Label><Select value={targetType} onValueChange={setTargetType}><SelectTrigger className="font-mono text-xs mt-1"><SelectValue /></SelectTrigger><SelectContent>{TARGET_TYPES.map((t) => <SelectItem key={t} value={t} className="font-mono text-xs uppercase">{t.replace("_", " ")}</SelectItem>)}</SelectContent></Select></div>
              <div><Label className="font-mono text-xs tracking-wider">TARGET ID (UUID)</Label><Input value={targetId} onChange={(e) => setTargetId(e.target.value)} placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" className="font-mono text-xs mt-1" /></div>
              <div><Label className="font-mono text-xs tracking-wider">CITED EVIDENCE</Label><Select value={evidenceId} onValueChange={setEvidenceId}><SelectTrigger className="font-mono text-xs mt-1"><SelectValue placeholder="Select evidence to cite..." /></SelectTrigger><SelectContent>{evidenceList.map((e) => <SelectItem key={e.id} value={e.id} className="font-mono text-xs">{e.title}</SelectItem>)}</SelectContent></Select></div>
              <Button onClick={() => createNote.mutate()} disabled={!content || !targetId || createNote.isPending} className="w-full font-mono text-xs tracking-wider">{createNote.isPending ? "SAVING..." : "SAVE NOTE"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <p className="font-mono text-[10px] text-muted-foreground/50 mb-6">Notes must cite evidence. Rated on usefulness — not agreement. Minority views persist.</p>

      {(isError || evidenceError) && (
        <QueryError message={(error || evidenceErr) instanceof Error ? (error || evidenceErr)!.message : "Failed to load notes."} />
      )}
      {evidenceLoading && <p className="font-mono text-[10px] text-muted-foreground mb-2 animate-pulse">LOADING EVIDENCE LIST...</p>}

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[300px]"><p className="font-mono text-xs text-muted-foreground animate-pulse">LOADING NOTES...</p></div>
      ) : sorted.length === 0 ? (
        <div className="border border-border rounded-sm bg-card p-8 flex flex-col items-center justify-center min-h-[400px]">
          <MessageSquare className="h-12 w-12 text-muted-foreground/20 mb-4" />
          <p className="font-mono text-xs text-muted-foreground tracking-wider">NO CONTEXT NOTES</p>
        </div>
      ) : (
        <div className="space-y-2">
          {sorted.map((note) => (
            <div key={note.id} className="border border-border rounded-sm bg-card p-4 hover:border-primary/30 transition-all">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="font-mono text-sm text-foreground mb-2">{note.content}</p>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[10px] tracking-wider uppercase text-muted-foreground border border-border px-2 py-0.5 rounded-sm">{note.target_type.replace("_", " ")}</span>
                    {note.evidence_id ? (<span className="font-mono text-[10px] text-success flex items-center gap-1"><Link2 className="h-3 w-3" />CITED</span>) : (<span className="font-mono text-[10px] text-muted-foreground/50">NO CITATION</span>)}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <div className="flex items-center gap-1"><ThumbsUp className="h-3 w-3 text-muted-foreground" /><span className="font-mono text-xs text-muted-foreground">{note.usefulness_score}</span></div>
                  <span className="font-mono text-[10px] text-muted-foreground/50">{new Date(note.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
