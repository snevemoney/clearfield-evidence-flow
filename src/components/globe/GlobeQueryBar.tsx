import { useState, useRef } from "react";
import { Sparkles, Send, Loader2 } from "lucide-react";

interface GlobeQueryBarProps {
  onQuery: (query: string) => void;
  isLoading: boolean;
}

const EXAMPLE_CHIPS = [
  "Epstein Island",
  "Five Eyes bases",
  "Billionaire residences",
  "Nuclear facilities",
  "CIA black sites",
  "World's largest data centers",
];

export function GlobeQueryBar({ onQuery, isLoading }: GlobeQueryBarProps) {
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const submit = () => {
    const q = input.trim();
    if (!q || isLoading) return;
    onQuery(q);
    setInput("");
  };

  return (
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 w-full max-w-xl px-4 pointer-events-auto" style={{ zIndex: 50 }}>
      {/* Example chips */}
      <div className="flex flex-wrap gap-1.5 justify-center">
        {EXAMPLE_CHIPS.map((chip) => (
          <button
            key={chip}
            onClick={() => { setInput(chip); inputRef.current?.focus(); }}
            disabled={isLoading}
            className="px-2.5 py-1 rounded-sm font-mono text-[9px] tracking-wider text-muted-foreground/70 border border-border/40 hover:border-primary/50 hover:text-primary transition-all bg-card/30 backdrop-blur-sm disabled:opacity-40"
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Input bar */}
      <div
        className={`flex items-center gap-2 w-full rounded-md border bg-card/80 backdrop-blur-md px-3 py-2 transition-all ${
          isLoading
            ? "border-primary/60 shadow-[0_0_20px_rgba(0,229,255,0.15)] animate-pulse"
            : "border-border/60 hover:border-primary/40"
        }`}
      >
        <Sparkles className="h-4 w-4 text-primary/70 shrink-0" />
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder={isLoading ? "ANALYZING GLOBAL DATA..." : "ASK THE GLOBE..."}
          disabled={isLoading}
          className="flex-1 bg-transparent text-sm font-mono text-foreground placeholder:text-muted-foreground/50 focus:outline-none disabled:opacity-60 tracking-wide"
        />
        <button
          onClick={submit}
          disabled={isLoading || !input.trim()}
          className="p-1.5 rounded-sm text-primary hover:bg-primary/10 transition-colors disabled:opacity-30"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  );
}
