import { useState, useRef, useEffect, useMemo } from "react";
import { Search, X, Crosshair } from "lucide-react";
import { type GraphNode } from "@/lib/demo-graph-data";
import { motion, AnimatePresence } from "framer-motion";

interface GraphSearchBarProps {
  nodes: GraphNode[];
  onFocusNode: (node: GraphNode) => void;
}

export function GraphSearchBar({ nodes, onFocusNode }: GraphSearchBarProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return nodes
      .filter((n) => n.label.toLowerCase().includes(q) || n.type.toLowerCase().includes(q))
      .slice(0, 8);
  }, [query, nodes]);

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  const handleSelect = (node: GraphNode) => {
    onFocusNode(node);
    setQuery("");
    setOpen(false);
  };

  return (
    <div className="absolute top-3 left-3 z-20">
      <AnimatePresence>
        {!open ? (
          <motion.button
            key="toggle"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            onClick={() => setOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm font-mono text-[10px] tracking-wider border border-border bg-card/90 backdrop-blur-sm text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all"
          >
            <Search className="h-3 w-3" />
            FIND NODE
          </motion.button>
        ) : (
          <motion.div
            key="search"
            initial={{ opacity: 0, width: 160 }}
            animate={{ opacity: 1, width: 280 }}
            exit={{ opacity: 0, width: 160 }}
            className="flex flex-col"
          >
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-t-sm border border-border bg-card/95 backdrop-blur-sm">
              <Search className="h-3 w-3 text-primary shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search entities..."
                className="flex-1 bg-transparent font-mono text-xs text-foreground placeholder:text-muted-foreground/50 outline-none"
              />
              <button onClick={() => { setQuery(""); setOpen(false); }} className="text-muted-foreground hover:text-foreground">
                <X className="h-3 w-3" />
              </button>
            </div>

            {results.length > 0 && (
              <div className="border border-t-0 border-border rounded-b-sm bg-card/95 backdrop-blur-sm max-h-48 overflow-y-auto">
                {results.map((node) => (
                  <button
                    key={node.id}
                    onClick={() => handleSelect(node)}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-left hover:bg-primary/10 transition-colors"
                  >
                    <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: getNodeColor(node.type) }} />
                    <span className="font-mono text-[10px] text-foreground truncate">{node.label}</span>
                    <span className="ml-auto font-mono text-[8px] text-muted-foreground tracking-wider uppercase shrink-0">{node.type}</span>
                    <Crosshair className="h-3 w-3 text-muted-foreground shrink-0" />
                  </button>
                ))}
              </div>
            )}

            {query.trim() && results.length === 0 && (
              <div className="border border-t-0 border-border rounded-b-sm bg-card/95 backdrop-blur-sm px-3 py-2">
                <span className="font-mono text-[10px] text-muted-foreground">No nodes found</span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function getNodeColor(type: string): string {
  const colors: Record<string, string> = {
    document: '#00d4ff', event: '#eab308', law: '#22c55e', institution: '#f97316',
    media_artifact: '#e879a0', person: '#a855f7', claim: '#f43f5e',
  };
  return colors[type] || '#64748b';
}
