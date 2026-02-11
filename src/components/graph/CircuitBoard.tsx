import { useCallback, useRef, useState, useEffect } from "react";
import ForceGraph2D from "react-force-graph-2d";
import { demoNodes, demoLinks, EDGE_COLORS, NODE_COLORS, type GraphNode } from "@/lib/demo-graph-data";

interface CircuitBoardProps {
  onNodeClick: (node: GraphNode | null) => void;
  filter: string[];
}

export function CircuitBoard({ onNodeClick, filter }: CircuitBoardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

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

  const filteredNodes = demoNodes.filter((n) => filter.length === 0 || filter.includes(n.type));
  const filteredNodeIds = new Set(filteredNodes.map((n) => n.id));
  const filteredLinks = demoLinks.filter(
    (l) => filteredNodeIds.has(l.source as string) && filteredNodeIds.has(l.target as string)
  );

  const graphData = {
    nodes: filteredNodes.map((n) => ({ ...n })),
    links: filteredLinks.map((l) => ({ ...l })),
  };

  const nodeCanvasObject = useCallback((node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const size = 5 + (node.sourceCount || 5) * 0.25;
    const color = NODE_COLORS[node.type] || "#64748b";
    const x = node.x || 0;
    const y = node.y || 0;

    // Circuit component: outer border
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.shadowColor = color;
    ctx.shadowBlur = 8;

    // All nodes as rectangles (circuit components)
    const w = size * 2.5;
    const h = size * 1.8;
    ctx.strokeRect(x - w / 2, y - h / 2, w, h);

    // Inner fill
    ctx.fillStyle = `${color}22`;
    ctx.fillRect(x - w / 2, y - h / 2, w, h);

    // Connection points (circuit pins)
    ctx.fillStyle = color;
    const pinSize = 1.5;
    // Top pin
    ctx.fillRect(x - pinSize / 2, y - h / 2 - 3, pinSize, 3);
    // Bottom pin
    ctx.fillRect(x - pinSize / 2, y + h / 2, pinSize, 3);
    // Left pin
    ctx.fillRect(x - w / 2 - 3, y - pinSize / 2, 3, pinSize);
    // Right pin
    ctx.fillRect(x + w / 2, y - pinSize / 2, 3, pinSize);

    ctx.shadowBlur = 0;

    // Label inside
    const fontSize = Math.max(8 / globalScale, 2);
    ctx.font = `${fontSize}px "JetBrains Mono", monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = color;
    ctx.fillText(node.label, x, y);

    // Type indicator below
    const typeFontSize = Math.max(6 / globalScale, 1.5);
    ctx.font = `${typeFontSize}px "JetBrains Mono", monospace`;
    ctx.fillStyle = `${color}88`;
    ctx.fillText(node.type.toUpperCase(), x, y + h / 2 + typeFontSize + 4);
  }, []);

  const linkCanvasObject = useCallback((link: any, ctx: CanvasRenderingContext2D) => {
    const color = EDGE_COLORS[link.type] || "#1e293b";
    const start = link.source;
    const end = link.target;
    if (!start || !end || typeof start.x !== "number") return;

    ctx.strokeStyle = color;
    ctx.lineWidth = 0.5;
    ctx.globalAlpha = 0.4;
    ctx.shadowColor = color;
    ctx.shadowBlur = 3;

    // Circuit board style: right-angle paths
    const midX = (start.x + end.x) / 2;
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(midX, start.y);
    ctx.lineTo(midX, end.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();

    // Data flow dot
    const t = (Date.now() % 3000) / 3000;
    const dotX = start.x + (end.x - start.x) * t;
    const dotY = start.y + (end.y - start.y) * t;
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.8;
    ctx.beginPath();
    ctx.arc(dotX, dotY, 1.5, 0, 2 * Math.PI);
    ctx.fill();

    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
  }, []);

  return (
    <div ref={containerRef} className="w-full h-full">
      <ForceGraph2D
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
        d3AlphaDecay={0.01}
        d3VelocityDecay={0.4}
        enableZoomInteraction={true}
        enablePanInteraction={true}
      />
    </div>
  );
}
