import { X, MapPin, ArrowRight, AlertTriangle, Rabbit } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

export interface AiQueryResult {
  query: string;
  summary: string;
  mode: "points" | "heatmap" | "arcs" | "mixed";
  locations: { lat: number; lng: number; label: string; description: string; category: string; weight: number }[];
  heatmapPoints: { lat: number; lng: number; weight: number }[];
  arcs: { startLat: number; startLng: number; endLat: number; endLng: number; label: string; description: string }[];
}

interface QueryResultPanelProps {
  result: AiQueryResult | null;
  onClear: () => void;
  onFlyTo: (lat: number, lng: number) => void;
}

export function QueryResultPanel({ result, onClear, onFlyTo }: QueryResultPanelProps) {
  const navigate = useNavigate();
  return (
    <AnimatePresence>
      {result && (
        <motion.div
          initial={{ x: -320, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -320, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="absolute top-0 left-0 h-full w-80 bg-card/90 backdrop-blur-md border-r border-border z-20 flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div className="font-mono text-[10px] tracking-widest text-primary">AI QUERY RESULT</div>
            <button onClick={onClear} className="p-1 text-muted-foreground hover:text-foreground transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Query */}
          <div className="px-4 py-3 border-b border-border/50">
            <div className="font-mono text-[9px] text-muted-foreground tracking-wider mb-1">QUERY</div>
            <p className="text-sm text-foreground font-medium">{result.query}</p>
          </div>

          {/* Summary */}
          <div className="px-4 py-3 border-b border-border/50">
            <div className="font-mono text-[9px] text-muted-foreground tracking-wider mb-1">SUMMARY</div>
            <p className="text-xs text-muted-foreground leading-relaxed">{result.summary}</p>
          </div>

          {/* Stats */}
          <div className="flex gap-3 px-4 py-2 border-b border-border/50 font-mono text-[9px] text-muted-foreground">
            <span>{result.locations.length} locations</span>
            <span>{result.heatmapPoints.length} heat pts</span>
            <span>{result.arcs.length} arcs</span>
          </div>

          {/* Location list */}
          <div className="flex-1 overflow-y-auto">
            {result.locations.map((loc, i) => (
              <button
                key={i}
                onClick={() => onFlyTo(loc.lat, loc.lng)}
                className="w-full text-left px-4 py-2.5 border-b border-border/30 hover:bg-primary/5 transition-colors group"
              >
                <div className="flex items-center gap-2">
                  <MapPin className="h-3 w-3 text-pink-400 shrink-0" />
                  <span className="text-xs font-medium text-foreground truncate flex-1">{loc.label}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); navigate(`/rabbit-hole?topic=${encodeURIComponent(loc.label)}`); }}
                    className="p-0.5 text-muted-foreground/40 hover:text-primary transition-colors shrink-0"
                    title="Start Rabbit Hole"
                  >
                    <Rabbit className="h-3 w-3" />
                  </button>
                  <ArrowRight className="h-3 w-3 text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2 pl-5">{loc.description}</p>
              </button>
            ))}
          </div>

          {/* Disclaimer */}
          <div className="px-4 py-2 border-t border-border bg-card/50 flex items-start gap-2">
            <AlertTriangle className="h-3 w-3 text-amber-500/70 shrink-0 mt-0.5" />
            <p className="font-mono text-[8px] text-muted-foreground/60 leading-relaxed">
              AI-generated locations. Verify with primary sources.
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
