import { Clock } from "lucide-react";

const Timeline = () => {
  return (
    <div className="min-h-screen p-6 grid-bg">
      <div className="flex items-center gap-3 mb-6">
        <Clock className="h-6 w-6 text-primary" />
        <h1 className="text-xl tracking-widest text-primary text-glow-cyan">TIMELINE ENGINE</h1>
      </div>

      <div className="border border-border rounded-sm bg-card min-h-[500px] flex flex-col items-center justify-center">
        <Clock className="h-16 w-16 text-muted-foreground/20 mb-4" />
        <p className="font-mono text-xs text-muted-foreground tracking-wider">TIMELINE — NO EVENTS</p>
        <p className="font-mono text-[10px] text-muted-foreground/50 mt-1">
          Verified • Disputed • Unknown gaps • Redacted periods
        </p>
        <div className="mt-6 flex gap-3">
          {["VERIFIED", "DISPUTED", "UNKNOWN", "REDACTED"].map((type, i) => (
            <div key={type} className="flex items-center gap-1.5">
              <div className={`h-2 w-2 rounded-full ${
                i === 0 ? "bg-success" : i === 1 ? "bg-accent" : i === 2 ? "bg-muted-foreground" : "bg-destructive"
              }`} />
              <span className="font-mono text-[9px] text-muted-foreground tracking-wider">{type}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Timeline;
