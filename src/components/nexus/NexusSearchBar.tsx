import { useState, useRef, useEffect, useMemo } from "react";
import { Search, X, Orbit } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getAllTopicIds, getTopicLabel, getTopicUniverse, type NexusNode } from "@/lib/demo-nexus-data";

interface NexusSearchBarProps {
  onNavigate: (topicId: string) => void;
  onSelectNode: (node: NexusNode) => void;
  currentTopic: string;
}

export function NexusSearchBar({ onNavigate, onSelectNode, currentTopic }: NexusSearchBarProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Build a flat list of all searchable items: topics + all nodes across all universes
  const searchItems = useMemo(() => {
    const items: { id: string; label: string; type: string; topicId: string; node?: NexusNode }[] = [];
    for (const topicId of getAllTopicIds()) {
      items.push({ id: topicId, label: getTopicLabel(topicId), type: "topic", topicId });
      const universe = getTopicUniverse(topicId);
      for (const ring of universe.rings) {
        for (const node of ring) {
          items.push({ id: node.id, label: node.label, type: node.type, topicId, node });
        }
      }
    }
    return items;
  }, []);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return searchItems
      .filter((item) => item.label.toLowerCase().includes(q) || item.type.toLowerCase().includes(q))
      .slice(0, 10);
  }, [query, searchItems]);

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  const handleSelect = (item: typeof searchItems[0]) => {
    if (item.type === "topic") {
      if (item.topicId !== currentTopic) onNavigate(item.topicId);
    } else if (item.node) {
      // Navigate to the topic first, then select the node
      if (item.topicId !== currentTopic) onNavigate(item.topicId);
      onSelectNode(item.node);
    }
    setQuery("");
    setOpen(false);
  };

  const typeColors: Record<string, string> = {
    topic: "#00e5ff",
    evidence: "#a78bfa",
    claim: "#f59e0b",
    connection: "#22c55e",
  };

  return (
    <div className="absolute top-3 right-3 z-20">
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
            FIND TOPIC
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
                placeholder="Search topics & nodes..."
                className="flex-1 bg-transparent font-mono text-xs text-foreground placeholder:text-muted-foreground/50 outline-none"
              />
              <button onClick={() => { setQuery(""); setOpen(false); }} className="text-muted-foreground hover:text-foreground">
                <X className="h-3 w-3" />
              </button>
            </div>

            {results.length > 0 && (
              <div className="border border-t-0 border-border rounded-b-sm bg-card/95 backdrop-blur-sm max-h-48 overflow-y-auto">
                {results.map((item) => (
                  <button
                    key={`${item.topicId}-${item.id}`}
                    onClick={() => handleSelect(item)}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-left hover:bg-primary/10 transition-colors"
                  >
                    <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: typeColors[item.type] || "#64748b" }} />
                    <span className="font-mono text-[10px] text-foreground truncate">{item.label}</span>
                    <span className="ml-auto font-mono text-[8px] text-muted-foreground tracking-wider uppercase shrink-0">{item.type}</span>
                    <Orbit className="h-3 w-3 text-muted-foreground shrink-0" />
                  </button>
                ))}
              </div>
            )}

            {query.trim() && results.length === 0 && (
              <div className="border border-t-0 border-border rounded-b-sm bg-card/95 backdrop-blur-sm px-3 py-2">
                <span className="font-mono text-[10px] text-muted-foreground">No results found</span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
