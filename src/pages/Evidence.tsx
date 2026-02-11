import { Archive, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

const Evidence = () => {
  return (
    <div className="min-h-screen p-6 grid-bg">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Archive className="h-6 w-6 text-success" />
          <h1 className="text-xl tracking-widest text-success">EVIDENCE ARCHIVE</h1>
        </div>
        <Button className="font-mono text-xs tracking-wider gap-2">
          <Plus className="h-4 w-4" />
          SUBMIT EVIDENCE
        </Button>
      </div>

      <div className="border border-border rounded-sm bg-card p-8 flex flex-col items-center justify-center min-h-[400px]">
        <Archive className="h-12 w-12 text-muted-foreground/20 mb-4" />
        <p className="font-mono text-xs text-muted-foreground tracking-wider">NO EVIDENCE ON RECORD</p>
        <p className="font-mono text-[10px] text-muted-foreground/50 mt-1">
          Evidence objects are neutral. They store metadata — never conclusions.
        </p>
      </div>
    </div>
  );
};

export default Evidence;
