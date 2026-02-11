import { motion, AnimatePresence } from "framer-motion";
import { X, FileText, AlertTriangle, ArrowRight } from "lucide-react";
import { type NexusNode, RING_LABELS } from "@/lib/demo-nexus-data";

interface NexusDetailPanelProps {
  node: NexusNode | null;
  onClose: () => void;
  onNavigate: (topicId: string) => void;
}

export function NexusDetailPanel({ node, onClose, onNavigate }: NexusDetailPanelProps) {
  if (!node) return null;

  return (
    <AnimatePresence>
      <motion.div
        key={node.id}
        initial={{ x: 300, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 300, opacity: 0 }}
        className="absolute top-0 right-0 w-80 h-full border-l border-border bg-card/95 backdrop-blur-sm z-20 overflow-y-auto"
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: node.color, boxShadow: `0 0 8px ${node.color}` }} />
            <span className="font-mono text-xs tracking-widest" style={{ color: node.color }}>
              {RING_LABELS[node.ring]}
            </span>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <h3 className="font-mono text-sm font-bold text-foreground">{node.label}</h3>
            <span className="font-mono text-[10px] text-muted-foreground tracking-wider">{node.type.toUpperCase()}</span>
          </div>

          <p className="font-mono text-[11px] text-muted-foreground leading-relaxed">{node.description}</p>

          <div className="flex items-center gap-2">
            <FileText className="h-3 w-3 text-primary" />
            <span className="font-mono text-[10px] text-primary">{node.sourceCount} SOURCES</span>
          </div>

          {node.children && node.children.length > 0 && (
            <div>
              <h4 className="font-mono text-[10px] tracking-widest text-muted-foreground mb-2">EXPLORE DEEPER</h4>
              {node.children.map((childId) => (
                <button
                  key={childId}
                  onClick={() => onNavigate(childId)}
                  className="flex items-center gap-2 w-full border border-border rounded-sm p-2 bg-secondary/30 hover:bg-secondary/60 transition-all mb-1.5"
                >
                  <ArrowRight className="h-3 w-3 text-primary" />
                  <span className="font-mono text-[10px] text-foreground">{childId.replace(/-/g, " ").toUpperCase()}</span>
                </button>
              ))}
            </div>
          )}

          <div className="border border-accent/30 rounded-sm p-2 bg-accent/5">
            <div className="flex items-center gap-1.5 mb-1">
              <AlertTriangle className="h-3 w-3 text-accent" />
              <span className="font-mono text-[9px] text-accent tracking-wider">NOTICE</span>
            </div>
            <p className="font-mono text-[9px] text-muted-foreground">
              This visualization organizes publicly available information by evidence density. Placement does not imply wrongdoing.
            </p>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
