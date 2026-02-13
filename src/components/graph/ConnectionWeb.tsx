import { useCallback, useRef, useState, useEffect, useMemo } from "react";
import ForceGraph2D from "react-force-graph-2d";
import { demoNodes, demoLinks, EDGE_COLORS, NODE_COLORS, type GraphNode, type GraphLink } from "@/lib/demo-graph-data";
import { useIntelEntriesRealtime, useIntelConnectionsRealtime } from "@/hooks/use-intel-realtime";

interface ConnectionWebProps {
  onNodeClick: (node: GraphNode | null) => void;
  filter: string[];
}

export function ConnectionWeb({ onNodeClick, filter }: ConnectionWebProps) {
  const graphRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const { data: intelEntries = [] } = useIntelEntriesRealtime();
  const { data: intelConnections = [] } = useIntelConnectionsRealtime();

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  // Convert intel entries to graph nodes
  const intelNodes: GraphNode[] = useMemo(() => {
    const validTypes = ["person", "institution", "event", "document", "claim"];
    return intelEntries
      .filter((e) => validTypes.includes(e.category))
      .map((e) => ({
        id: `intel-${e.id}`,
        label: e.title.length > 25 ? e.title.slice(0, 25) + "…" : e.title,
        type: e.category as GraphNode["type"],
        description: e.description || e.ai_summary || e.title,
        sourceCount: e.credibility_score ? Math.round(e.credibility_score / 10) : 3,
        group: 10, // intel group
      }));
  }, [intelEntries]);

  // Convert intel connections to graph links
  const intelLinks: GraphLink[] = useMemo(() => {
    const entryIds = new Set(intelEntries.map((e) => e.id));
    return intelConnections
      .filter((c) => entryIds.has(c.source_entry_id) && entryIds.has(c.target_entry_id))
      .map((c) => ({
        source: `intel-${c.source_entry_id}`,
        target: `intel-${c.target_entry_id}`,
        type: (c.connection_type === "financial" ? "financial" : c.connection_type === "contradiction" ? "contradiction" : "citation") as GraphLink["type"],
        description: c.description || `${c.connection_type} connection`,
      }));
  }, [intelConnections, intelEntries]);

  const allNodes = useMemo(() => [...demoNodes, ...intelNodes], [intelNodes]);
  const allLinks = useMemo(() => [...demoLinks, ...intelLinks], [intelLinks]);

  const filteredNodes = allNodes.filter((n) => filter.length === 0 || filter.includes(n.type));
  const filteredNodeIds = new Set(filteredNodes.map((n) => n.id));
  const filteredLinks = allLinks.filter(
    (l) => filteredNodeIds.has(l.source as string) && filteredNodeIds.has(l.target as string)
  );

  const graphData = {
    nodes: filteredNodes.map((n) => ({ ...n })),
    links: filteredLinks.map((l) => ({ ...l })),
  };

  const nodeCanvasObject = useCallback((node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const size = 4 + (node.sourceCount || 5) * 0.3;
    const color = NODE_COLORS[node.type] || "#64748b";
    const x = node.x || 0;
    const y = node.y || 0;
    const isIntel = node.id?.startsWith("intel-");

    // Glow
    ctx.shadowColor = color;
    ctx.shadowBlur = isIntel ? 16 : 12;

    // Shape by type
    ctx.fillStyle = color;
    ctx.beginPath();
    if (node.type === "institution") {
      ctx.arc(x, y, size, 0, 2 * Math.PI);
    } else if (node.type === "event") {
      ctx.rect(x - size, y - size, size * 2, size * 2);
    } else if (node.type === "document") {
      ctx.moveTo(x, y - size * 1.2);
      ctx.lineTo(x + size, y);
      ctx.lineTo(x, y + size * 1.2);
      ctx.lineTo(x - size, y);
    } else if (node.type === "law") {
      ctx.arc(x, y, size, 0, 2 * Math.PI);
    } else {
      ctx.arc(x, y, size, 0, 2 * Math.PI);
    }
    ctx.fill();
    ctx.shadowBlur = 0;

    // Intel indicator ring
    if (isIntel) {
      ctx.strokeStyle = "#22c55e";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(x, y, size + 2, 0, 2 * Math.PI);
      ctx.stroke();
    }

    // Label
    const fontSize = Math.max(10 / globalScale, 2.5);
    ctx.font = `${fontSize}px "JetBrains Mono", monospace`;
    ctx.textAlign = "center";
    ctx.fillStyle = isIntel ? "rgba(134,239,172,0.9)" : "rgba(200,220,240,0.9)";
    ctx.fillText(node.label, x, y + size + fontSize + 1);
  }, []);

  const linkCanvasObject = useCallback((link: any, ctx: CanvasRenderingContext2D) => {
    const color = EDGE_COLORS[link.type] || "#334155";
    const start = link.source;
    const end = link.target;
    if (!start || !end || typeof start.x !== "number") return;

    ctx.strokeStyle = color;
    ctx.lineWidth = link.type === "contradiction" ? 1.5 : 0.8;
    ctx.globalAlpha = 0.6;
    ctx.shadowColor = color;
    ctx.shadowBlur = 4;

    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();

    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
  }, []);

  return (
    <div ref={containerRef} className="w-full h-full">
      <ForceGraph2D
        ref={graphRef}
        graphData={graphData}
        width={dimensions.width}
        height={dimensions.height}
        backgroundColor="rgba(0,0,0,0)"
        nodeCanvasObject={nodeCanvasObject}
        linkCanvasObject={linkCanvasObject}
        onNodeClick={(node: any) => onNodeClick(node as GraphNode)}
        onBackgroundClick={() => onNodeClick(null)}
        nodeId="id"
        cooldownTicks={100}
        d3AlphaDecay={0.02}
        d3VelocityDecay={0.3}
        enableZoomInteraction={true}
        enablePanInteraction={true}
      />
    </div>
  );
}
