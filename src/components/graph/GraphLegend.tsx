import { useState } from "react";
import { Info, ChevronDown, ChevronUp } from "lucide-react";
import { NODE_COLORS, EDGE_COLORS } from "@/lib/demo-graph-data";
import { motion, AnimatePresence } from "framer-motion";

const NODE_LEGEND = [
  { key: "person", label: "Person" },
  { key: "institution", label: "Institution" },
  { key: "event", label: "Event" },
  { key: "document", label: "Document" },
  { key: "law", label: "Law" },
  { key: "media_artifact", label: "Media Artifact" },
  { key: "claim", label: "Claim" },
];

const EDGE_LEGEND = [
  { key: "citation", label: "Citation", dash: false },
  { key: "contradiction", label: "Contradiction", dash: true },
  { key: "temporal_overlap", label: "Temporal Overlap", dash: false },
  { key: "source_reuse", label: "Source Reuse", dash: false },
  { key: "financial", label: "Financial", dash: false },
];

export function GraphLegend() {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="absolute bottom-3 right-3 z-20">
      <div className="border border-border rounded-sm bg-card/95 backdrop-blur-sm overflow-hidden">
        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-1.5 px-3 py-1.5 w-full font-mono text-[10px] tracking-wider text-muted-foreground hover:text-foreground transition-colors"
        >
          <Info className="h-3 w-3 text-primary" />
          <span>LEGEND</span>
          {expanded ? <ChevronDown className="h-3 w-3 ml-auto" /> : <ChevronUp className="h-3 w-3 ml-auto" />}
        </button>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-3 pb-2 pt-1 border-t border-border space-y-2">
                {/* Node types */}
                <div>
                  <span className="font-mono text-[8px] text-muted-foreground tracking-widest">NODES</span>
                  <div className="mt-1 grid grid-cols-2 gap-x-4 gap-y-0.5">
                    {NODE_LEGEND.map((n) => (
                      <div key={n.key} className="flex items-center gap-1.5">
                        <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: NODE_COLORS[n.key] }} />
                        <span className="font-mono text-[9px] text-foreground/80">{n.label}</span>
                      </div>
                    ))}
                    <div className="flex items-center gap-1.5">
                      <div className="h-2 w-2 rounded-full shrink-0 border border-green-400" style={{ backgroundColor: "transparent" }} />
                      <span className="font-mono text-[9px] text-green-400/80">Intel (live)</span>
                    </div>
                  </div>
                </div>

                {/* Edge types */}
                <div>
                  <span className="font-mono text-[8px] text-muted-foreground tracking-widest">CONNECTIONS</span>
                  <div className="mt-1 space-y-0.5">
                    {EDGE_LEGEND.map((e) => (
                      <div key={e.key} className="flex items-center gap-2">
                        <svg width="20" height="6" className="shrink-0">
                          <line
                            x1="0" y1="3" x2="20" y2="3"
                            stroke={EDGE_COLORS[e.key]}
                            strokeWidth={e.dash ? 1.5 : 1}
                            strokeDasharray={e.dash ? "3 2" : undefined}
                          />
                        </svg>
                        <span className="font-mono text-[9px] text-foreground/80">{e.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Size note */}
                <div className="pt-1 border-t border-border/50">
                  <span className="font-mono text-[8px] text-muted-foreground/70 leading-tight block">
                    Node size = source count. Hover to highlight neighbors.
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
