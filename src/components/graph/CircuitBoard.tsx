import { useCallback, useRef, useState, useEffect, useImperativeHandle, forwardRef } from "react";
import ForceGraph2D from "react-force-graph-2d";
import { demoNodes, demoLinks, EDGE_COLORS, NODE_COLORS, type GraphNode } from "@/lib/demo-graph-data";
import * as d3 from "d3-force";
import type { GraphHandle } from "@/components/graph/ConnectionWeb";

interface CircuitBoardProps {
  onNodeClick: (node: GraphNode | null) => void;
  filter: string[];
  onNodesReady?: (nodes: GraphNode[]) => void;
}

export const CircuitBoard = forwardRef<GraphHandle, CircuitBoardProps>(function CircuitBoard({ onNodeClick, filter, onNodesReady }, ref) {
  const graphRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [stabilized, setStabilized] = useState(false);

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

  useEffect(() => { onNodesReady?.(demoNodes); }, [onNodesReady]);

  useImperativeHandle(ref, () => ({
    focusNode: (nodeId: string) => {
      if (!graphRef.current) return;
      const fg = graphRef.current;
      const node = fg.graphData().nodes.find((n: any) => n.id === nodeId);
      if (node) {
        fg.centerAt(node.x, node.y, 600);
        fg.zoom(3, 600);
        onNodeClick(node as GraphNode);
      }
    },
    getNodes: () => demoNodes,
  }), [onNodeClick]);

  const filteredNodes = demoNodes.filter((n) => filter.length === 0 || filter.includes(n.type));
  const filteredNodeIds = new Set(filteredNodes.map((n) => n.id));
  const filteredLinks = demoLinks.filter(
    (l) => filteredNodeIds.has(l.source as string) && filteredNodeIds.has(l.target as string)
  );

  const graphData = {
    nodes: filteredNodes.map((n) => ({ ...n })),
    links: filteredLinks.map((l) => ({ ...l })),
  };

  // Build neighbor map for hover highlighting
  const neighborMap = new Map<string, Set<string>>();
  filteredLinks.forEach((l) => {
    const s = typeof l.source === "string" ? l.source : (l.source as any).id;
    const t = typeof l.target === "string" ? l.target : (l.target as any).id;
    if (!neighborMap.has(s)) neighborMap.set(s, new Set());
    if (!neighborMap.has(t)) neighborMap.set(t, new Set());
    neighborMap.get(s)!.add(t);
    neighborMap.get(t)!.add(s);
  });

  const isHighlighted = (nodeId: string) => {
    if (!hoveredNode) return true;
    if (nodeId === hoveredNode) return true;
    return neighborMap.get(hoveredNode)?.has(nodeId) || false;
  };

  const isLinkHighlighted = (link: any) => {
    if (!hoveredNode) return true;
    const s = typeof link.source === "string" ? link.source : link.source?.id;
    const t = typeof link.target === "string" ? link.target : link.target?.id;
    return s === hoveredNode || t === hoveredNode;
  };

  // Configure forces
  useEffect(() => {
    if (!graphRef.current) return;
    const fg = graphRef.current;
    fg.d3Force("charge")?.strength(-400);
    fg.d3Force("link")?.distance(120);
    fg.d3Force("collide", d3.forceCollide().radius(30));
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
    const color = NODE_COLORS[node.type] || "#64748b";
    const x = node.x || 0;
    const y = node.y || 0;
    const highlighted = isHighlighted(node.id);
    const isHovered = node.id === hoveredNode;

    ctx.globalAlpha = highlighted ? 1 : 0.15;

    // Measure label to size the rectangle
    const fontSize = isHovered ? Math.max(10 / globalScale, 3) : Math.max(8 / globalScale, 2);
    ctx.font = `${fontSize}px "JetBrains Mono", monospace`;
    const labelWidth = ctx.measureText(node.label).width;
    const w = Math.max(labelWidth + 16, 30);
    const h = 20;

    // Circuit component: outer border with glow
    ctx.shadowColor = color;
    ctx.shadowBlur = isHovered ? 14 : 8;
    ctx.strokeStyle = color;
    ctx.lineWidth = isHovered ? 2 : 1;
    ctx.strokeRect(x - w / 2, y - h / 2, w, h);

    // Inner fill
    ctx.fillStyle = `${color}18`;
    ctx.fillRect(x - w / 2, y - h / 2, w, h);

    ctx.shadowBlur = 0;

    // Connection pins (top, bottom, left, right)
    ctx.fillStyle = color;
    const pinW = 2;
    const pinH = 5;
    ctx.fillRect(x - pinW / 2, y - h / 2 - pinH, pinW, pinH);
    ctx.fillRect(x - pinW / 2, y + h / 2, pinW, pinH);
    ctx.fillRect(x - w / 2 - pinH, y - pinW / 2, pinH, pinW);
    ctx.fillRect(x + w / 2, y - pinW / 2, pinH, pinW);

    // Label inside
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = color;
    ctx.fillText(node.label, x, y);

    // Type indicator below
    const typeFontSize = Math.max(6 / globalScale, 1.5);
    ctx.font = `${typeFontSize}px "JetBrains Mono", monospace`;
    ctx.fillStyle = `${color}77`;
    ctx.fillText(node.type.toUpperCase(), x, y + h / 2 + typeFontSize + 6);

    ctx.globalAlpha = 1;
  }, [hoveredNode]);

  const linkCanvasObject = useCallback((link: any, ctx: CanvasRenderingContext2D) => {
    const color = EDGE_COLORS[link.type] || "#1e293b";
    const start = link.source;
    const end = link.target;
    if (!start || !end || typeof start.x !== "number") return;

    const highlighted = isLinkHighlighted(link);
    ctx.globalAlpha = highlighted ? 0.5 : 0.06;

    ctx.strokeStyle = color;
    ctx.lineWidth = 0.8;
    ctx.shadowColor = color;
    ctx.shadowBlur = 3;

    // Right-angle path with offset to avoid overlap
    const hash = ((start.x * 7 + end.y * 13) | 0) % 20 - 10;
    const midX = (start.x + end.x) / 2 + hash;
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(midX, start.y);
    ctx.lineTo(midX, end.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();

    // Link type dot at midpoint
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(midX, (start.y + end.y) / 2, 2.5, 0, 2 * Math.PI);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
  }, [hoveredNode]);

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
        d3AlphaDecay={0.01}
        d3VelocityDecay={0.5}
        onEngineStop={handleEngineStop}
        enableZoomInteraction={true}
        enablePanInteraction={true}
      />
    </div>
  );
});
