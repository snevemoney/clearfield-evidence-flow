import { useCallback, useRef, useState, useEffect, useMemo } from "react";
import ForceGraph2D from "react-force-graph-2d";
import { demoNodes, demoLinks, EDGE_COLORS, NODE_COLORS, type GraphNode, type GraphLink } from "@/lib/demo-graph-data";
import { useIntelEntriesRealtime as useIntelEntries, useIntelConnectionsRealtime as useIntelConnections } from "@/hooks/use-intel-realtime";
import * as d3 from "d3-force";

interface ConnectionWebProps {
  onNodeClick: (node: GraphNode | null) => void;
  filter: string[];
}

export function ConnectionWeb({ onNodeClick, filter }: ConnectionWebProps) {
  const graphRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [stabilized, setStabilized] = useState(false);
  const { data: intelEntries = [] } = useIntelEntries();
  const { data: intelConnections = [] } = useIntelConnections();

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
        group: 10,
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

  const graphData = useMemo(() => ({
    nodes: filteredNodes.map((n) => ({ ...n })),
    links: filteredLinks.map((l) => ({ ...l })),
  }), [filteredNodes, filteredLinks]);

  // Build neighbor map for hover highlighting
  const neighborMap = useMemo(() => {
    const map = new Map<string, Set<string>>();
    filteredLinks.forEach((l) => {
      const s = typeof l.source === "string" ? l.source : (l.source as any).id;
      const t = typeof l.target === "string" ? l.target : (l.target as any).id;
      if (!map.has(s)) map.set(s, new Set());
      if (!map.has(t)) map.set(t, new Set());
      map.get(s)!.add(t);
      map.get(t)!.add(s);
    });
    return map;
  }, [filteredLinks]);

  const isHighlighted = useCallback((nodeId: string) => {
    if (!hoveredNode) return true;
    if (nodeId === hoveredNode) return true;
    return neighborMap.get(hoveredNode)?.has(nodeId) || false;
  }, [hoveredNode, neighborMap]);

  const isLinkHighlighted = useCallback((link: any) => {
    if (!hoveredNode) return true;
    const s = typeof link.source === "string" ? link.source : link.source?.id;
    const t = typeof link.target === "string" ? link.target : link.target?.id;
    return s === hoveredNode || t === hoveredNode;
  }, [hoveredNode]);

  // Configure forces
  useEffect(() => {
    if (!graphRef.current) return;
    const fg = graphRef.current;
    fg.d3Force("charge")?.strength(-300);
    fg.d3Force("link")?.distance((link: any) => {
      if (link.type === "contradiction") return 180;
      if (link.type === "financial") return 140;
      return 100;
    });
    fg.d3Force("collide", d3.forceCollide().radius((node: any) => {
      const size = 6 + (node.sourceCount || 5) * 0.5;
      return size + 20;
    }));
    fg.d3Force("center", d3.forceCenter(0, 0).strength(0.05));
  }, [graphData]);

  // Zoom to fit after stabilization
  const handleEngineStop = useCallback(() => {
    if (!stabilized && graphRef.current) {
      graphRef.current.zoomToFit(400, 60);
      setStabilized(true);
    }
  }, [stabilized]);

  const nodeCanvasObject = useCallback((node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const size = 6 + (node.sourceCount || 5) * 0.5;
    const color = NODE_COLORS[node.type] || "#64748b";
    const x = node.x || 0;
    const y = node.y || 0;
    const isIntel = node.id?.startsWith("intel-");
    const highlighted = isHighlighted(node.id);
    const isHovered = node.id === hoveredNode;

    ctx.globalAlpha = highlighted ? 1 : 0.15;

    // Outer glow
    ctx.shadowColor = color;
    ctx.shadowBlur = isHovered ? 20 : 10;

    // Filled circle
    ctx.beginPath();
    ctx.arc(x, y, size, 0, 2 * Math.PI);
    ctx.fillStyle = `${color}33`;
    ctx.fill();

    // Border ring
    ctx.strokeStyle = color;
    ctx.lineWidth = isHovered ? 2.5 : 1.5;
    ctx.stroke();

    // Center dot
    ctx.beginPath();
    ctx.arc(x, y, size * 0.35, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.fill();

    ctx.shadowBlur = 0;

    // Intel pulsing ring
    if (isIntel) {
      const pulse = 0.5 + 0.5 * Math.sin(Date.now() / 400);
      ctx.strokeStyle = `rgba(34,197,94,${0.4 + pulse * 0.5})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(x, y, size + 3 + pulse * 2, 0, 2 * Math.PI);
      ctx.stroke();
    }

    // Label card
    const fontSize = isHovered ? Math.max(13 / globalScale, 4) : Math.max(10 / globalScale, 2.5);
    ctx.font = `bold ${fontSize}px "JetBrains Mono", monospace`;
    ctx.textAlign = "center";
    const labelWidth = ctx.measureText(node.label).width + 8;
    const labelHeight = fontSize + 4;
    const labelY = y + size + 6;

    // Dark card background
    ctx.fillStyle = "rgba(10, 15, 25, 0.85)";
    ctx.beginPath();
    const r = 3;
    ctx.roundRect(x - labelWidth / 2, labelY - labelHeight / 2, labelWidth, labelHeight, r);
    ctx.fill();

    // Label text
    ctx.fillStyle = isIntel ? "rgba(134,239,172,0.95)" : "rgba(200,220,240,0.95)";
    ctx.textBaseline = "middle";
    ctx.fillText(node.label, x, labelY);

    // Type badge
    const typeFontSize = Math.max(7 / globalScale, 1.8);
    ctx.font = `${typeFontSize}px "JetBrains Mono", monospace`;
    ctx.fillStyle = `${color}77`;
    ctx.fillText(node.type.toUpperCase(), x, labelY + labelHeight / 2 + typeFontSize + 1);

    ctx.globalAlpha = 1;
  }, [hoveredNode, isHighlighted]);

  const linkCanvasObject = useCallback((link: any, ctx: CanvasRenderingContext2D) => {
    const color = EDGE_COLORS[link.type] || "#334155";
    const start = link.source;
    const end = link.target;
    if (!start || !end || typeof start.x !== "number") return;

    const highlighted = isLinkHighlighted(link);
    ctx.globalAlpha = highlighted ? 0.7 : 0.08;

    // Curved bezier line (detective string)
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const curvature = 0.15;
    const cpX = (start.x + end.x) / 2 - dy * curvature;
    const cpY = (start.y + end.y) / 2 + dx * curvature;

    ctx.strokeStyle = color;
    ctx.lineWidth = link.type === "contradiction" ? 1.8 : 1;
    ctx.shadowColor = color;
    ctx.shadowBlur = 3;

    if (link.type === "contradiction") {
      ctx.setLineDash([4, 3]);
    } else {
      ctx.setLineDash([]);
    }

    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.quadraticCurveTo(cpX, cpY, end.x, end.y);
    ctx.stroke();
    ctx.setLineDash([]);

    // Arrow at end
    const arrowSize = 4;
    const angle = Math.atan2(end.y - cpY, end.x - cpX);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(end.x, end.y);
    ctx.lineTo(end.x - arrowSize * Math.cos(angle - 0.4), end.y - arrowSize * Math.sin(angle - 0.4));
    ctx.lineTo(end.x - arrowSize * Math.cos(angle + 0.4), end.y - arrowSize * Math.sin(angle + 0.4));
    ctx.closePath();
    ctx.fill();

    // Edge type label at midpoint
    if (highlighted && dist > 80) {
      const midX = cpX;
      const midY = cpY;
      const fontSize = 6;
      ctx.font = `${fontSize}px "JetBrains Mono", monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = `${color}99`;
      ctx.fillText(link.type.toUpperCase(), midX, midY - 5);
    }

    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
  }, [isLinkHighlighted]);

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
        onNodeHover={(node: any) => setHoveredNode(node?.id || null)}
        onBackgroundClick={() => onNodeClick(null)}
        nodeId="id"
        cooldownTicks={100}
        warmupTicks={50}
        d3AlphaDecay={0.03}
        d3VelocityDecay={0.3}
        onEngineStop={handleEngineStop}
        enableZoomInteraction={true}
        enablePanInteraction={true}
      />
    </div>
  );
}
