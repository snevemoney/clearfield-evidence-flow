import { HelpCircle, AlertTriangle } from "lucide-react";

const sections = [
  "KNOWN FACTS",
  "DISPUTED CLAIMS",
  "UNKNOWNS",
  "MISSING DOCUMENTS",
  "REDACTIONS",
  "OPEN QUESTIONS",
];

const Unknowns = () => {
  return (
    <div className="min-h-screen p-6 grid-bg">
      <div className="flex items-center gap-3 mb-2">
        <HelpCircle className="h-6 w-6 text-accent" />
        <h1 className="text-xl tracking-widest text-accent">WHAT WE DON'T KNOW</h1>
      </div>
      <p className="font-mono text-[10px] text-muted-foreground tracking-wider mb-6">
        MANDATORY PANEL — Gaps in knowledge are features, not bugs.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sections.map((section) => (
          <div
            key={section}
            className="border border-border rounded-sm bg-card p-5 border-l-2 border-l-accent/40 hover:border-l-accent transition-all"
          >
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-3.5 w-3.5 text-accent" />
              <h2 className="font-mono text-xs tracking-widest text-accent">{section}</h2>
            </div>
            <p className="font-mono text-[10px] text-muted-foreground/50">No entries yet</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Unknowns;
