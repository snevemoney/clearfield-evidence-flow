import { MessageSquare } from "lucide-react";

const ContextNotes = () => {
  return (
    <div className="min-h-screen p-6 grid-bg">
      <div className="flex items-center gap-3 mb-6">
        <MessageSquare className="h-6 w-6 text-primary" />
        <h1 className="text-xl tracking-widest text-primary text-glow-cyan">COMMUNITY CONTEXT NOTES</h1>
      </div>

      <div className="border border-border rounded-sm bg-card p-8 flex flex-col items-center justify-center min-h-[400px]">
        <MessageSquare className="h-12 w-12 text-muted-foreground/20 mb-4" />
        <p className="font-mono text-xs text-muted-foreground tracking-wider">NO CONTEXT NOTES</p>
        <p className="font-mono text-[10px] text-muted-foreground/50 mt-1">
          Notes must cite evidence. Rated on usefulness — not agreement. Minority views persist.
        </p>
      </div>
    </div>
  );
};

export default ContextNotes;
