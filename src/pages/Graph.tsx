import { useState } from "react";
import { GitBranch, Cpu, Network, Filter } from "lucide-react";
import { motion } from "framer-motion";
import { ConnectionWeb } from "@/components/graph/ConnectionWeb";
import { CircuitBoard } from "@/components/graph/CircuitBoard";
import { NodeDetailPanel } from "@/components/graph/NodeDetailPanel";
import { EDGE_COLORS, NODE_COLORS, type GraphNode } from "@/lib/demo-graph-data";

type ViewMode = "web" | "circuit";

const nodeTypes = [
  { key: "institution", label: "INSTITUTIONS" },
  { key: "event", label: "EVENTS" },
  { key: "document", label: "DOCUMENTS" },
  { key: "person", label: "PERSONS" },
  { key: "law", label: "LAWS" },
  { key: "media_artifact", label: "MEDIA" },
  { key: "claim", label: "CLAIMS" },
];

const Graph = () => {
  const [viewMode, setViewMode] = useState<ViewMode>("web");
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [filter, setFilter] = useState<string[]>([]);

  const toggleFilter = (type: string) => {
    setFilter((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  return (
    <div className="h-screen flex flex-col grid-bg">
      {/* Header bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-card/80 backdrop-blur-sm z-10">
        <div className="flex items-center gap-3">
          <GitBranch className="h-5 w-5 text-primary" />
          <h1 className="text-sm tracking-widest text-primary text-glow-cyan">EVIDENCE GRAPH</h1>
          <span className="font-mono text-[10px] text-muted-foreground ml-2">
            // INTERACTIVE INTELLIGENCE MAP
          </span>
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-1 border border-border rounded-sm p-0.5">
          <button
            onClick={() => setViewMode("web")}
            className={`flex items-center gap-1.5 px-3 py-1.5 font-mono text-[10px] tracking-wider rounded-sm transition-all ${
              viewMode === "web"
                ? "bg-primary/20 text-primary border-glow-cyan border"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Network className="h-3 w-3" />
            THE WEB
          </button>
          <button
            onClick={() => setViewMode("circuit")}
            className={`flex items-center gap-1.5 px-3 py-1.5 font-mono text-[10px] tracking-wider rounded-sm transition-all ${
              viewMode === "circuit"
                ? "bg-primary/20 text-primary border-glow-cyan border"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Cpu className="h-3 w-3" />
            INTEL VIEW
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-2 px-6 py-2 border-b border-border bg-card/50">
        <Filter className="h-3 w-3 text-muted-foreground" />
        <span className="font-mono text-[9px] text-muted-foreground tracking-wider mr-2">FILTER:</span>
        {nodeTypes.map((nt) => {
          const active = filter.length === 0 || filter.includes(nt.key);
          const color = NODE_COLORS[nt.key];
          return (
            <button
              key={nt.key}
              onClick={() => toggleFilter(nt.key)}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-sm font-mono text-[9px] tracking-wider border transition-all ${
                active
                  ? "border-border text-foreground"
                  : "border-transparent text-muted-foreground/40"
              }`}
            >
              <div
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: active ? color : "#334155" }}
              />
              {nt.label}
            </button>
          );
        })}

        <div className="ml-auto flex items-center gap-3">
          {Object.entries(EDGE_COLORS).map(([type, color]) => (
            <div key={type} className="flex items-center gap-1">
              <div className="h-px w-3" style={{ backgroundColor: color }} />
              <span className="font-mono text-[8px] text-muted-foreground tracking-wider">
                {type.toUpperCase().replace("_", " ")}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Graph canvas */}
      <div className="flex-1 relative overflow-hidden">
        <motion.div
          key={viewMode}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="w-full h-full"
        >
          {viewMode === "web" ? (
            <ConnectionWeb onNodeClick={setSelectedNode} filter={filter} />
          ) : (
            <CircuitBoard onNodeClick={setSelectedNode} filter={filter} />
          )}
        </motion.div>

        {/* Node detail panel */}
        <NodeDetailPanel node={selectedNode} onClose={() => setSelectedNode(null)} />

        {/* Watermark */}
        <div className="absolute bottom-3 left-6 font-mono text-[9px] text-muted-foreground/30 tracking-widest">
          CLEARFIELD // EVIDENCE GRAPH v0.1 // ALL CONNECTIONS REQUIRE CITATION
        </div>
      </div>
    </div>
  );
};

export default Graph;
