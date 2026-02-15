import { motion, AnimatePresence } from "framer-motion";
import { X, ExternalLink, FileText, AlertTriangle, Orbit, Rabbit, Globe } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { demoLinks, EDGE_COLORS, NODE_COLORS, demoNodes, type GraphNode } from "@/lib/demo-graph-data";

interface NodeDetailPanelProps {
  node: GraphNode | null;
  onClose: () => void;
}

export function NodeDetailPanel({ node, onClose }: NodeDetailPanelProps) {
  const navigate = useNavigate();
  if (!node) return null;

  const connections = demoLinks.filter((l) => l.source === node.id || l.target === node.id);
  const color = NODE_COLORS[node.type] || "#64748b";

  return (
    <AnimatePresence>
      <motion.div
        key={node.id}
        initial={{ x: 300, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 300, opacity: 0 }}
        className="absolute top-0 right-0 w-80 h-full border-l border-border bg-card/95 backdrop-blur-sm z-20 overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}` }} />
            <span className="font-mono text-xs tracking-widest" style={{ color }}>
              {node.type.toUpperCase()}
            </span>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          <div>
            <h3 className="font-mono text-sm font-bold text-foreground">{node.label}</h3>
            <p className="font-mono text-[11px] text-muted-foreground mt-1">{node.description}</p>
          </div>

          <div className="flex items-center gap-2">
            <FileText className="h-3 w-3 text-primary" />
            <span className="font-mono text-[10px] text-primary">{node.sourceCount} SOURCES</span>
          </div>

          {/* Connections */}
          <div>
            <h4 className="font-mono text-[10px] tracking-widest text-muted-foreground mb-2">
              CONNECTIONS ({connections.length})
            </h4>
            <div className="space-y-2">
              {connections.map((conn, i) => {
                const targetId = conn.source === node.id ? conn.target : conn.source;
                const targetNode = demoNodes.find((n) => n.id === targetId);
                const edgeColor = EDGE_COLORS[conn.type];
                return (
                  <div key={i} className="border border-border rounded-sm p-2 bg-secondary/30">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: edgeColor }} />
                      <span className="font-mono text-[9px] tracking-wider" style={{ color: edgeColor }}>
                        {conn.type.toUpperCase().replace("_", " ")}
                      </span>
                    </div>
                    <p className="font-mono text-[10px] text-foreground">{targetNode?.label}</p>
                    <p className="font-mono text-[9px] text-muted-foreground mt-0.5">{conn.description}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Cross-reference */}
          <div>
            <h4 className="font-mono text-[10px] tracking-widest text-muted-foreground mb-2">CROSS-REFERENCE</h4>
            <button
              onClick={() => navigate(`/visualize?mode=nexus&topic=${encodeURIComponent(node.label)}`)}
              className="flex items-center gap-2 w-full border border-border rounded-sm p-2 bg-secondary/30 hover:bg-secondary/60 transition-all mb-1.5"
            >
              <Orbit className="h-3 w-3 text-primary" />
              <span className="font-mono text-[10px] text-foreground">EXPLORE IN NEXUS</span>
            </button>
            <button
              onClick={() => navigate(`/rabbit-hole?topic=${encodeURIComponent(node.label)}`)}
              className="flex items-center gap-2 w-full border border-border rounded-sm p-2 bg-secondary/30 hover:bg-secondary/60 transition-all mb-1.5"
            >
              <Rabbit className="h-3 w-3 text-primary" />
              <span className="font-mono text-[10px] text-foreground">START RABBIT HOLE</span>
            </button>
            <button
              onClick={() => navigate(`/visualize?mode=globe&search=${encodeURIComponent(node.label)}`)}
              className="flex items-center gap-2 w-full border border-border rounded-sm p-2 bg-secondary/30 hover:bg-secondary/60 transition-all mb-1.5"
            >
              <Globe className="h-3 w-3 text-primary" />
              <span className="font-mono text-[10px] text-foreground">VIEW ON GLOBE</span>
            </button>
          </div>

          {/* Disclaimer */}
          <div className="border border-accent/30 rounded-sm p-2 bg-accent/5">
            <div className="flex items-center gap-1.5 mb-1">
              <AlertTriangle className="h-3 w-3 text-accent" />
              <span className="font-mono text-[9px] text-accent tracking-wider">NOTICE</span>
            </div>
            <p className="font-mono text-[9px] text-muted-foreground">
              All connections shown are based on cited evidence. This visualization does not imply guilt,
              wrongdoing, or conspiracy.
            </p>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
