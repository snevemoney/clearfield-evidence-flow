import { GitBranch } from "lucide-react";

const Graph = () => {
  return (
    <div className="min-h-screen p-6 grid-bg">
      <div className="flex items-center gap-3 mb-6">
        <GitBranch className="h-6 w-6 text-primary" />
        <h1 className="text-xl tracking-widest text-primary text-glow-cyan">EVIDENCE GRAPH</h1>
      </div>

      <div className="border border-border rounded-sm bg-card min-h-[600px] flex flex-col items-center justify-center relative overflow-hidden">
        {/* Decorative grid */}
        <div className="absolute inset-0 grid-bg opacity-50" />
        <div className="relative z-10 text-center">
          <GitBranch className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" />
          <p className="font-mono text-xs text-muted-foreground tracking-wider">
            EVIDENCE GRAPH — AWAITING DATA
          </p>
          <p className="font-mono text-[10px] text-muted-foreground/50 mt-1">
            Nodes: Documents, Events, Laws, Institutions • Edges: Citation, Contradiction, Temporal Overlap
          </p>
        </div>
      </div>
    </div>
  );
};

export default Graph;
