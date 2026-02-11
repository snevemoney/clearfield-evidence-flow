import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Layers, ChevronDown, FileText, AlertTriangle, Eye, X } from "lucide-react";
import { icebergData, type IcebergItem } from "@/lib/demo-graph-data";

const depths = [
  { key: "surface", label: "SURFACE", subtitle: "Well-sourced, acknowledged facts", gradient: "from-cyan-500/20 to-cyan-600/5", borderColor: "border-cyan-500/30", textColor: "text-cyan-400" },
  { key: "shallow", label: "SHALLOW", subtitle: "Disputed claims with partial evidence", gradient: "from-blue-600/20 to-blue-700/5", borderColor: "border-blue-500/30", textColor: "text-blue-400" },
  { key: "deep", label: "DEEP", subtitle: "Speculation with minimal sourcing", gradient: "from-indigo-700/20 to-indigo-900/5", borderColor: "border-indigo-500/30", textColor: "text-indigo-400" },
  { key: "abyss", label: "THE ABYSS", subtitle: "Open questions — zero evidence", gradient: "from-slate-800/40 to-slate-950/20", borderColor: "border-slate-600/30", textColor: "text-slate-500" },
];

const statusColors: Record<string, string> = {
  verified: "text-emerald-400 border-emerald-500/30",
  disputed: "text-amber-400 border-amber-500/30",
  speculative: "text-indigo-400 border-indigo-500/30",
  unknown: "text-slate-500 border-slate-600/30",
};

const IcebergExplorer = () => {
  const [expandedDepth, setExpandedDepth] = useState<string | null>("surface");
  const [selectedItem, setSelectedItem] = useState<IcebergItem | null>(null);

  return (
    <div className="min-h-screen grid-bg">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-border bg-card/80 backdrop-blur-sm">
        <Layers className="h-5 w-5 text-primary" />
        <h1 className="text-sm tracking-widest text-primary text-glow-cyan">DEPTH VIEW</h1>
        <span className="font-mono text-[10px] text-muted-foreground ml-2">
          // THE ICEBERG EXPLORER
        </span>
      </div>

      <div className="max-w-4xl mx-auto py-6 px-6 relative">
        {/* Water line indicator */}
        <div className="flex items-center gap-3 mb-6">
          <div className="h-px flex-1 bg-cyan-500/30" />
          <span className="font-mono text-[9px] text-cyan-400/60 tracking-widest">▼ PUBLIC KNOWLEDGE ▼</span>
          <div className="h-px flex-1 bg-cyan-500/30" />
        </div>

        {/* Iceberg layers */}
        <div className="space-y-2">
          {depths.map((depth, di) => {
            const items = icebergData.filter((i) => i.depth === depth.key);
            const isExpanded = expandedDepth === depth.key;

            return (
              <motion.div
                key={depth.key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: di * 0.15 }}
              >
                {/* Depth header */}
                <button
                  onClick={() => setExpandedDepth(isExpanded ? null : depth.key)}
                  className={`w-full border ${depth.borderColor} rounded-sm bg-gradient-to-b ${depth.gradient} p-4 text-left transition-all hover:brightness-110`}
                  style={{
                    marginLeft: `${di * 8}px`,
                    marginRight: `${di * 8}px`,
                    width: `calc(100% - ${di * 16}px)`,
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className={`font-mono text-xs tracking-widest font-bold ${depth.textColor}`}>
                        {depth.label}
                      </span>
                      <span className="font-mono text-[10px] text-muted-foreground ml-3">
                        {depth.subtitle}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`font-mono text-[10px] ${depth.textColor}`}>
                        {items.length} ITEMS
                      </span>
                      <ChevronDown
                        className={`h-3 w-3 ${depth.textColor} transition-transform ${isExpanded ? "rotate-180" : ""}`}
                      />
                    </div>
                  </div>
                </button>

                {/* Expanded items */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                      style={{
                        marginLeft: `${di * 8 + 8}px`,
                        marginRight: `${di * 8 + 8}px`,
                      }}
                    >
                      <div className="space-y-1 pt-2">
                        {items.map((item) => (
                          <motion.button
                            key={item.id}
                            onClick={() => setSelectedItem(item)}
                            className={`w-full text-left border ${depth.borderColor} rounded-sm p-3 bg-card/50 hover:bg-card/80 transition-all`}
                            whileHover={{ x: 4 }}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1">
                                <p className="font-mono text-[11px] text-foreground">{item.title}</p>
                                <div className="flex items-center gap-3 mt-1.5">
                                  <span className={`font-mono text-[9px] tracking-wider border rounded-sm px-1.5 py-0.5 ${statusColors[item.status]}`}>
                                    {item.status.toUpperCase()}
                                  </span>
                                  <span className="font-mono text-[9px] text-muted-foreground flex items-center gap-1">
                                    <FileText className="h-2.5 w-2.5" />
                                    {item.evidenceCount} sources
                                  </span>
                                </div>
                              </div>
                              <Eye className="h-3 w-3 text-muted-foreground/50 mt-1 shrink-0" />
                            </div>
                          </motion.button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

        {/* Depth indicator */}
        <div className="flex items-center gap-3 mt-6">
          <div className="h-px flex-1 bg-slate-700/30" />
          <span className="font-mono text-[9px] text-slate-600 tracking-widest">▼ BEYOND KNOWN ▼</span>
          <div className="h-px flex-1 bg-slate-700/30" />
        </div>

        {/* Warning */}
        <div className="mt-6 border border-accent/20 rounded-sm p-4 bg-accent/5 text-center">
          <AlertTriangle className="h-4 w-4 text-accent mx-auto mb-2" />
          <p className="font-mono text-[10px] text-muted-foreground tracking-wider">
            Depth placement is determined by evidence density, not truth.
            <br />
            Items near the surface have more citations — not more validity.
          </p>
        </div>
      </div>

      {/* Detail modal */}
      <AnimatePresence>
        {selectedItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
            onClick={() => setSelectedItem(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="border border-border rounded-sm bg-card p-6 max-w-md w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <span className={`font-mono text-[10px] tracking-widest ${statusColors[selectedItem.status]?.split(" ")[0]}`}>
                  {selectedItem.status.toUpperCase()} // {selectedItem.depth.toUpperCase()}
                </span>
                <button onClick={() => setSelectedItem(null)}>
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
              <h3 className="font-mono text-sm font-bold text-foreground mb-2">{selectedItem.title}</h3>
              <p className="font-mono text-[11px] text-muted-foreground mb-4">{selectedItem.description}</p>
              <div className="flex items-center gap-2">
                <FileText className="h-3 w-3 text-primary" />
                <span className="font-mono text-[10px] text-primary">{selectedItem.evidenceCount} LINKED SOURCES</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default IcebergExplorer;
