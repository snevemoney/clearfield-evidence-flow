import { useCallback, useRef, useState, useEffect, useMemo, useImperativeHandle, forwardRef } from "react";
import ForceGraph2D from "react-force-graph-2d";
import { NODE_COLORS, EDGE_COLORS, type GraphNode, type GraphLink } from "@/lib/demo-graph-data";
import { useIntelEntriesRealtime as useIntelEntries, useIntelConnectionsRealtime as useIntelConnections } from "@/hooks/use-intel-realtime";
import type { IntelEntry } from "@/hooks/use-intel-data";
import type { GraphHandle } from "@/components/graph/ConnectionWeb";
import * as d3 from "d3-force";

// Card dimensions
const CARD_W = 160;
const CARD_H = 90;
const PIN_R = 5;

const STATUS_COLORS: Record<string, string> = {
  verified: "#22c55e",
  disputed: "#eab308",
  unverified: "#64748b",
};

const CONNECTION_COLORS: Record<string, string> = {
  contradiction: "#ef4444",
  financial: "#eab308",
  social: "#a855f7",
  citation: "#00d4ff",
};

interface ShadowBoardProps {
  onNodeClick: (node: GraphNode | null) => void;
  filter: string[];
  onNodesReady?: (nodes: GraphNode[]) => void;
}

function entryToNode(e: IntelEntry): GraphNode {
  return {
    id: `intel-${e.id}`,
    label: e.title.length > 28 ? e.title.slice(0, 28) + "…" : e.title,
    type: (["person", "institution", "event", "document", "claim"].includes(e.category) ? e.category : "document") as GraphNode["type"],
    description: e.description || e.ai_summary || e.title,
    sourceCount: e.credibility_score ? Math.round(e.credibility_score / 10) : 3,
    group: 10,
  };
}

export const ShadowBoard = forwardRef<GraphHandle, ShadowBoardProps>(function ShadowBoard({ onNodeClick, filter, onNodesReady }, ref) {
  const graphRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const graphDataRef = useRef<{ nodes: any[]; links: any[] }>({ nodes: [], links: [] });
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [stabilized, setStabilized] = useState(false);

  const { data: intelEntries = [], isError: entriesError, isLoading: entriesLoading } = useIntelEntries();
  const { data: intelConnections = [], isError: linksError, isLoading: linksLoading } = useIntelConnections();

  // Resize
  useEffect(() => {
    const update = () => {
      if (containerRef.current) {
        setDimensions({ width: containerRef.current.clientWidth, height: containerRef.current.clientHeight });
      }
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // Convert intel entries to graph nodes with extra metadata
  const intelNodes = useMemo(() => {
    const validTypes = ["person", "institution", "event", "document", "claim"];
    return intelEntries
      .filter((e) => validTypes.includes(e.category))
      .map((e) => ({
        ...entryToNode(e),
        _credibility: e.credibility_score ?? 50,
        _status: e.fact_check_status || "unverified",
        _category: e.category,
        _descFull: e.description || e.ai_summary || "",
      }));
  }, [intelEntries]);

  // Convert connections to links
  const intelLinks: GraphLink[] = useMemo(() => {
    const entryIds = new Set(intelEntries.map((e) => e.id));
    return intelConnections
      .filter((c) => entryIds.has(c.source_entry_id) && entryIds.has(c.target_entry_id))
      .map((c) => ({
        source: `intel-${c.source_entry_id}`,
        target: `intel-${c.target_entry_id}`,
        type: (c.connection_type === "financial" ? "financial" : c.connection_type === "contradiction" ? "contradiction" : "citation") as GraphLink["type"],
        description: c.description || `${c.connection_type} connection`,
        _connectionType: c.connection_type,
      }));
  }, [intelConnections, intelEntries]);

  const allNodes = useMemo(() => intelNodes, [intelNodes]);

  useEffect(() => { onNodesReady?.(allNodes); }, [allNodes, onNodesReady]);

  useImperativeHandle(ref, () => ({
    focusNode: (nodeId: string) => {
      if (!graphRef.current) return;
      const node = graphDataRef.current.nodes.find((n: any) => n.id === nodeId);
      if (node && typeof node.x === "number") {
        graphRef.current.centerAt(node.x, node.y, 600);
        graphRef.current.zoom(2, 600);
        onNodeClick(node as GraphNode);
      }
    },
    getNodes: () => allNodes,
  }), [allNodes, onNodeClick]);

  const filteredNodes = allNodes.filter((n) => filter.length === 0 || filter.includes(n.type));
  const filteredNodeIds = new Set(filteredNodes.map((n) => n.id));
  const filteredLinks = intelLinks.filter(
    (l) => filteredNodeIds.has(l.source as string) && filteredNodeIds.has(l.target as string)
  );

  const graphData = useMemo(() => {
    const data = {
      nodes: filteredNodes.map((n) => ({ ...n })),
      links: filteredLinks.map((l) => ({ ...l })),
    };
    graphDataRef.current = data;
    return data;
  }, [filteredNodes, filteredLinks]);

  // Neighbor map for hover highlighting
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

  // Force config — wider spacing for card-sized nodes
  useEffect(() => {
    if (!graphRef.current) return;
    const fg = graphRef.current;
    fg.d3Force("charge")?.strength(-500);
    fg.d3Force("link")?.distance(200);
    fg.d3Force("collide", d3.forceCollide().radius(() => CARD_W * 0.6));
    fg.d3Force("center", d3.forceCenter(0, 0).strength(0.05));
  }, [graphData]);

  const handleEngineStop = useCallback(() => {
    if (!stabilized && graphRef.current) {
      graphRef.current.zoomToFit(400, 80);
      setStabilized(true);
    }
  }, [stabilized]);

  // ---- Custom dossier card rendering ----
  const nodeCanvasObject = useCallback((node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const x = node.x || 0;
    const y = node.y || 0;
    const color = NODE_COLORS[node.type] || "#64748b";
    const statusColor = STATUS_COLORS[node._status] || "#64748b";
    const highlighted = isHighlighted(node.id);
    const isHovered = node.id === hoveredNode;
    const credibility = node._credibility ?? 50;

    const w = CARD_W / globalScale;
    const h = CARD_H / globalScale;
    const pinR = PIN_R / globalScale;

    ctx.globalAlpha = highlighted ? 1 : 0.12;

    // Card shadow
    ctx.shadowColor = isHovered ? color : "rgba(0,0,0,0.6)";
    ctx.shadowBlur = isHovered ? 18 / globalScale : 8 / globalScale;
    ctx.shadowOffsetX = 2 / globalScale;
    ctx.shadowOffsetY = 3 / globalScale;

    // Card background — dark slate
    ctx.fillStyle = isHovered ? "rgba(25, 32, 45, 0.97)" : "rgba(18, 24, 35, 0.93)";
    ctx.beginPath();
    ctx.roundRect(x - w / 2, y - h / 2, w, h, 3 / globalScale);
    ctx.fill();

    // Border with category glow
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.strokeStyle = isHovered ? color : `${color}55`;
    ctx.lineWidth = isHovered ? 2 / globalScale : 1 / globalScale;
    ctx.stroke();

    // Pin dot (top-left)
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x - w / 2 + pinR * 2, y - h / 2 + pinR * 2, pinR, 0, Math.PI * 2);
    ctx.fill();
    // Pin highlight
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.beginPath();
    ctx.arc(x - w / 2 + pinR * 2 - pinR * 0.25, y - h / 2 + pinR * 2 - pinR * 0.25, pinR * 0.35, 0, Math.PI * 2);
    ctx.fill();

    // Category stamp watermark
    const stampSize = 7 / globalScale;
    ctx.font = `bold ${stampSize}px "JetBrains Mono", monospace`;
    ctx.textAlign = "right";
    ctx.textBaseline = "top";
    ctx.fillStyle = `${color}15`;
    ctx.save();
    ctx.translate(x + w / 2 - 4 / globalScale, y - h / 2 + 4 / globalScale);
    ctx.rotate(-0.15);
    ctx.fillText((node._category || node.type).toUpperCase(), 0, 0);
    ctx.restore();

    // Title
    const titleSize = Math.max(8 / globalScale, 2);
    ctx.font = `bold ${titleSize}px "JetBrains Mono", monospace`;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillStyle = isHovered ? "#e2e8f0" : "#cbd5e1";
    const titleX = x - w / 2 + pinR * 4 + 4 / globalScale;
    const titleY = y - h / 2 + 6 / globalScale;
    ctx.fillText(node.label, titleX, titleY);

    // Description snippet (2 lines max)
    const descSize = Math.max(5.5 / globalScale, 1.5);
    ctx.font = `${descSize}px "JetBrains Mono", monospace`;
    ctx.fillStyle = "#64748b";
    const desc = (node._descFull || node.description || "").slice(0, 60);
    const descY = titleY + titleSize + 4 / globalScale;
    ctx.fillText(desc.slice(0, 30), titleX, descY);
    if (desc.length > 30) {
      ctx.fillText(desc.slice(30, 60) + (desc.length >= 60 ? "…" : ""), titleX, descY + descSize + 2 / globalScale);
    }

    // Fact-check status badge
    const badgeSize = Math.max(5 / globalScale, 1.5);
    ctx.font = `bold ${badgeSize}px "JetBrains Mono", monospace`;
    const statusLabel = (node._status || "unverified").toUpperCase();
    const badgeW = ctx.measureText(statusLabel).width + 6 / globalScale;
    const badgeH = badgeSize + 4 / globalScale;
    const badgeX = x + w / 2 - badgeW - 4 / globalScale;
    const badgeY = y + h / 2 - badgeH - 10 / globalScale;
    ctx.fillStyle = `${statusColor}25`;
    ctx.beginPath();
    ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 2 / globalScale);
    ctx.fill();
    ctx.fillStyle = statusColor;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(statusLabel, badgeX + badgeW / 2, badgeY + badgeH / 2);

    // Credibility score bar (bottom edge)
    const barY = y + h / 2 - 4 / globalScale;
    const barH = 2.5 / globalScale;
    const barX = x - w / 2 + 4 / globalScale;
    const barMaxW = w - 8 / globalScale;
    // Background bar
    ctx.fillStyle = "rgba(100,116,139,0.2)";
    ctx.fillRect(barX, barY, barMaxW, barH);
    // Filled portion
    const credFrac = credibility / 100;
    const credColor = credibility > 70 ? "#22c55e" : credibility > 40 ? "#eab308" : "#ef4444";
    ctx.fillStyle = credColor;
    ctx.fillRect(barX, barY, barMaxW * credFrac, barH);

    ctx.globalAlpha = 1;
  }, [hoveredNode, isHighlighted]);

  // ---- String/wire connections ----
  const linkCanvasObject = useCallback((link: any, ctx: CanvasRenderingContext2D) => {
    const start = link.source;
    const end = link.target;
    if (!start || !end || typeof start.x !== "number") return;

    const connType = (link as any)._connectionType || link.type || "citation";
    const color = CONNECTION_COLORS[connType] || "#00d4ff";
    const highlighted = isLinkHighlighted(link);

    ctx.globalAlpha = highlighted ? 0.75 : 0.08;

    // Slight curve
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const curvature = 0.1;
    const cpX = (start.x + end.x) / 2 - dy * curvature;
    const cpY = (start.y + end.y) / 2 + dx * curvature;

    ctx.strokeStyle = color;
    ctx.lineWidth = connType === "contradiction" ? 2 : 1.2;
    ctx.shadowColor = color;
    ctx.shadowBlur = 4;

    if (connType === "contradiction") {
      ctx.setLineDash([6, 4]);
    } else {
      ctx.setLineDash([]);
    }

    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.quadraticCurveTo(cpX, cpY, end.x, end.y);
    ctx.stroke();
    ctx.setLineDash([]);

    // Thumbtack dots at endpoints
    ctx.shadowBlur = 0;
    ctx.fillStyle = color;
    [start, end].forEach((pt) => {
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 3, 0, Math.PI * 2);
      ctx.fill();
    });

    // Type label at midpoint
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (highlighted && dist > 100) {
      ctx.font = '6px "JetBrains Mono", monospace';
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = `${color}aa`;
      ctx.fillText(connType.toUpperCase(), cpX, cpY - 6);
    }

    ctx.globalAlpha = 1;
  }, [isLinkHighlighted]);

  // Empty state
  const isEmpty = intelEntries.length === 0;

  return (
    <div ref={containerRef} className="w-full h-full relative" style={{ background: "radial-gradient(ellipse at 50% 50%, hsl(220 20% 12%) 0%, hsl(220 25% 7%) 100%)" }}>
      {(entriesError || linksError) && (
        <p className="absolute top-2 left-2 z-20 font-mono text-[10px] text-destructive" role="alert">Failed to load board intel.</p>
      )}
      {(entriesLoading || linksLoading) && !entriesError && !linksError && (
        <p className="absolute top-2 left-2 z-20 font-mono text-[10px] text-muted-foreground animate-pulse">LOADING BOARD...</p>
      )}
      {isEmpty ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
          <span className="font-mono text-sm text-muted-foreground/40 tracking-widest">NO INTEL DATA</span>
          <span className="font-mono text-[10px] text-muted-foreground/20 tracking-wider">INGEST INTELLIGENCE TO POPULATE THE SHADOW BOARD</span>
        </div>
      ) : (
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
      )}

      {/* Status legend */}
      <div className="absolute top-3 right-3 flex items-center gap-3 z-10">
        {Object.entries(STATUS_COLORS).map(([status, color]) => (
          <div key={status} className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
            <span className="font-mono text-[8px] text-muted-foreground tracking-wider">{status.toUpperCase()}</span>
          </div>
        ))}
      </div>

      {/* String legend */}
      <div className="absolute bottom-3 right-3 flex items-center gap-3 z-10">
        {Object.entries(CONNECTION_COLORS).map(([type, color]) => (
          <div key={type} className="flex items-center gap-1">
            <div className="h-px w-4" style={{ backgroundColor: color }} />
            <span className="font-mono text-[8px] text-muted-foreground tracking-wider">{type.toUpperCase()}</span>
          </div>
        ))}
      </div>
    </div>
  );
});
