import { FileText, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

const Claims = () => {
  return (
    <div className="min-h-screen p-6 grid-bg">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <FileText className="h-6 w-6 text-primary" />
          <h1 className="text-xl tracking-widest text-primary text-glow-cyan">CLAIMS</h1>
        </div>
        <Button className="font-mono text-xs tracking-wider gap-2">
          <Plus className="h-4 w-4" />
          NEW CLAIM
        </Button>
      </div>

      <div className="border border-border rounded-sm bg-card p-8 flex flex-col items-center justify-center min-h-[400px]">
        <FileText className="h-12 w-12 text-muted-foreground/20 mb-4" />
        <p className="font-mono text-xs text-muted-foreground tracking-wider">NO CLAIMS FILED</p>
        <p className="font-mono text-[10px] text-muted-foreground/50 mt-1">
          Claims are user statements — not facts. Each requires evidence or is marked unsupported.
        </p>
      </div>
    </div>
  );
};

export default Claims;
