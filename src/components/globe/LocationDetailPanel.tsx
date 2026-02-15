import { motion, AnimatePresence } from "framer-motion";
import { X, FileText, AlertTriangle, MapPin, Orbit, Rabbit } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { type GlobeLocation, CATEGORY_COLORS } from "@/lib/demo-globe-data";

interface LocationDetailPanelProps {
  location: GlobeLocation | null;
  onClose: () => void;
}

export function LocationDetailPanel({ location, onClose }: LocationDetailPanelProps) {
  const navigate = useNavigate();
  if (!location) return null;

  const color = CATEGORY_COLORS[location.category] || "#64748b";

  return (
    <AnimatePresence>
      <motion.div
        key={location.id}
        initial={{ x: 300, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 300, opacity: 0 }}
        className="absolute top-0 right-0 w-80 h-full border-l border-border bg-card/95 backdrop-blur-sm z-20 overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <div
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}` }}
            />
            <span className="font-mono text-xs tracking-widest" style={{ color }}>
              {location.category.toUpperCase()}
            </span>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          <div>
            <h3 className="font-mono text-sm font-bold text-foreground">{location.label}</h3>
            <div className="flex items-center gap-1.5 mt-1">
              <MapPin className="h-3 w-3 text-muted-foreground" />
              <span className="font-mono text-[10px] text-muted-foreground">
                {location.lat.toFixed(4)}°, {location.lng.toFixed(4)}°
              </span>
            </div>
          </div>

          <p className="font-mono text-[11px] text-muted-foreground leading-relaxed">
            {location.description}
          </p>

          <div className="flex items-center gap-2">
            <FileText className="h-3 w-3 text-primary" />
            <span className="font-mono text-[10px] text-primary">
              {location.sourceCount} LINKED SOURCES
            </span>
          </div>

          {/* Evidence IDs */}
          <div>
            <h4 className="font-mono text-[10px] tracking-widest text-muted-foreground mb-2">
              EVIDENCE REFERENCES ({location.evidenceIds.length})
            </h4>
            <div className="space-y-1.5">
              {location.evidenceIds.map((evId) => (
                <div
                  key={evId}
                  className="border border-border rounded-sm p-2 bg-secondary/30 font-mono text-[10px] text-foreground"
                >
                  {evId}
                </div>
              ))}
            </div>
          </div>

          {/* Cross-reference */}
          <div>
            <h4 className="font-mono text-[10px] tracking-widest text-muted-foreground mb-2">CROSS-REFERENCE</h4>
            <button
              onClick={() => navigate(`/visualize?mode=nexus&topic=${encodeURIComponent(location.label)}`)}
              className="flex items-center gap-2 w-full border border-border rounded-sm p-2 bg-secondary/30 hover:bg-secondary/60 transition-all mb-1.5"
            >
              <Orbit className="h-3 w-3 text-primary" />
              <span className="font-mono text-[10px] text-foreground">EXPLORE IN NEXUS</span>
            </button>
            <button
              onClick={() => navigate(`/rabbit-hole?topic=${encodeURIComponent(location.label)}`)}
              className="flex items-center gap-2 w-full border border-border rounded-sm p-2 bg-secondary/30 hover:bg-secondary/60 transition-all mb-1.5"
            >
              <Rabbit className="h-3 w-3 text-primary" />
              <span className="font-mono text-[10px] text-foreground">START RABBIT HOLE</span>
            </button>
          </div>

          {/* Disclaimer */}
          <div className="border border-accent/30 rounded-sm p-2 bg-accent/5">
            <div className="flex items-center gap-1.5 mb-1">
              <AlertTriangle className="h-3 w-3 text-accent" />
              <span className="font-mono text-[9px] text-accent tracking-wider">NOTICE</span>
            </div>
            <p className="font-mono text-[9px] text-muted-foreground">
              Location markers represent publicly documented sites referenced in evidence objects.
              Placement does not imply wrongdoing.
            </p>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
