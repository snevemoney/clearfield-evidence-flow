import { useCallback, useRef, useState, useEffect, useMemo, useImperativeHandle, forwardRef } from "react";
import { NODE_COLORS, type GraphNode } from "@/lib/demo-graph-data";
import { useIntelEntriesRealtime as useIntelEntries, useIntelConnectionsRealtime as useIntelConnections } from "@/hooks/use-intel-realtime";
import type { IntelEntry } from "@/hooks/use-intel-data";
import type { GraphHandle } from "@/components/graph/ConnectionWeb";
import { Slider } from "@/components/ui/slider";

// Category lanes for Y-axis
const CATEGORY_ORDER = ["person", "institution", "event", "document", "claim", "evidence"] as const;
const CATEGORY_LABELS: Record<string, string> = {
  person: "PERSONS",
  institution: "INSTITUTIONS",
  event: "EVENTS",
  document: "DOCUMENTS",
  claim: "CLAIMS",
  evidence: "EVIDENCE",
};

interface TemporalGridProps {
  onNodeClick: (node: GraphNode | null) => void;
  filter: string[];
  onNodesReady?: (nodes: GraphNode[]) => void;
}

function entryToNode(e: IntelEntry): GraphNode {
  return {
    id: `intel-${e.id}`,
    label: e.title.length > 22 ? e.title.slice(0, 22) + "…" : e.title,
    type: (["person", "institution", "event", "document", "claim"].includes(e.category) ? e.category : "document") as GraphNode["type"],
    description: e.description || e.ai_summary || e.title,
    sourceCount: e.credibility_score ? Math.round(e.credibility_score / 10) : 3,
    group: 10,
  };
}

// Fact-check status colors
const STATUS_COLORS: Record<string, string> = {
  verified: "#22c55e",
  disputed: "#eab308",
  unverified: "#64748b",
};

export const TemporalGrid = forwardRef<GraphHandle, TemporalGridProps>(function TemporalGrid({ onNodeClick, filter, onNodesReady }, ref) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<[number, number]>([0, 100]);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });

  const { data: intelEntries = [] } = useIntelEntries();
  const { data: intelConnections = [] } = useIntelConnections();

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

  // Filtered entries with dates
  const entriesWithDates = useMemo(() => {
    return intelEntries
      .filter((e) => e.published_at || e.ingested_at)
      .filter((e) => filter.length === 0 || filter.includes(e.category));
  }, [intelEntries, filter]);

  // Time bounds
  const timeBounds = useMemo(() => {
    if (entriesWithDates.length === 0) return { min: Date.now() - 86400000 * 30, max: Date.now() };
    const times = entriesWithDates.map((e) => new Date(e.published_at || e.ingested_at).getTime());
    const min = Math.min(...times);
    const max = Math.max(...times);
    // Add padding
    const pad = Math.max((max - min) * 0.05, 86400000);
    return { min: min - pad, max: max + pad };
  }, [entriesWithDates]);

  // Filtered by time slider
  const visibleEntries = useMemo(() => {
    const tMin = timeBounds.min + (timeBounds.max - timeBounds.min) * (timeRange[0] / 100);
    const tMax = timeBounds.min + (timeBounds.max - timeBounds.min) * (timeRange[1] / 100);
    return entriesWithDates.filter((e) => {
      const t = new Date(e.published_at || e.ingested_at).getTime();
      return t >= tMin && t <= tMax;
    });
  }, [entriesWithDates, timeRange, timeBounds]);

  // Nodes for search bar
  const graphNodes = useMemo(() => entriesWithDates.map(entryToNode), [entriesWithDates]);
  useEffect(() => { onNodesReady?.(graphNodes); }, [graphNodes, onNodesReady]);

  useImperativeHandle(ref, () => ({
    focusNode: (nodeId: string) => {
      const entry = intelEntries.find((e) => `intel-${e.id}` === nodeId);
      if (entry) onNodeClick(entryToNode(entry));
    },
    getNodes: () => graphNodes,
  }), [graphNodes, onNodeClick, intelEntries]);

  // Layout constants
  const MARGIN = { top: 50, right: 40, bottom: 80, left: 130 };
  const plotW = dimensions.width - MARGIN.left - MARGIN.right;
  const plotH = dimensions.height - MARGIN.top - MARGIN.bottom;
  const laneHeight = plotH / CATEGORY_ORDER.length;

  // Position computation
  const nodePositions = useMemo(() => {
    const tMin = timeBounds.min + (timeBounds.max - timeBounds.min) * (timeRange[0] / 100);
    const tMax = timeBounds.min + (timeBounds.max - timeBounds.min) * (timeRange[1] / 100);
    const tRange = tMax - tMin || 1;

    return visibleEntries.map((e) => {
      const t = new Date(e.published_at || e.ingested_at).getTime();
      const x = MARGIN.left + ((t - tMin) / tRange) * plotW;
      const catIdx = CATEGORY_ORDER.indexOf(e.category as any);
      const yLane = catIdx >= 0 ? catIdx : CATEGORY_ORDER.length - 1;
      const y = MARGIN.top + yLane * laneHeight + laneHeight / 2;
      return { entry: e, x, y, node: entryToNode(e) };
    });
  }, [visibleEntries, timeBounds, timeRange, plotW, plotH, MARGIN.left, MARGIN.top, laneHeight]);

  // Density per lane (for density bars)
  const laneDensity = useMemo(() => {
    const counts: Record<string, number> = {};
    CATEGORY_ORDER.forEach((c) => (counts[c] = 0));
    visibleEntries.forEach((e) => {
      const cat = CATEGORY_ORDER.includes(e.category as any) ? e.category : "document";
      counts[cat] = (counts[cat] || 0) + 1;
    });
    const max = Math.max(1, ...Object.values(counts));
    return { counts, max };
  }, [visibleEntries]);

  // Draw
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = dimensions.width * dpr;
    canvas.height = dimensions.height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, dimensions.width, dimensions.height);

    // Apply pan
    ctx.save();
    ctx.translate(pan.x, pan.y);

    // Grid lines
    ctx.strokeStyle = "rgba(100,200,255,0.06)";
    ctx.lineWidth = 1;

    // Horizontal lane dividers
    CATEGORY_ORDER.forEach((_, i) => {
      const y = MARGIN.top + i * laneHeight;
      ctx.beginPath();
      ctx.moveTo(MARGIN.left, y);
      ctx.lineTo(MARGIN.left + plotW, y);
      ctx.stroke();
    });
    // Bottom line
    ctx.beginPath();
    ctx.moveTo(MARGIN.left, MARGIN.top + plotH);
    ctx.lineTo(MARGIN.left + plotW, MARGIN.top + plotH);
    ctx.stroke();

    // Y-axis lane labels
    CATEGORY_ORDER.forEach((cat, i) => {
      const y = MARGIN.top + i * laneHeight + laneHeight / 2;
      const color = NODE_COLORS[cat] || "#64748b";

      // Density bar
      const density = (laneDensity.counts[cat] || 0) / laneDensity.max;
      ctx.fillStyle = `${color}15`;
      ctx.fillRect(MARGIN.left, MARGIN.top + i * laneHeight, plotW * density, laneHeight);

      // Label
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      ctx.fillStyle = `${color}aa`;
      ctx.fillText(CATEGORY_LABELS[cat] || cat.toUpperCase(), MARGIN.left - 12, y);

      // Count badge
      const count = laneDensity.counts[cat] || 0;
      if (count > 0) {
        ctx.font = '8px "JetBrains Mono", monospace';
        ctx.fillStyle = `${color}55`;
        ctx.fillText(`(${count})`, MARGIN.left - 12, y + 12);
      }
    });

    // X-axis time labels
    const tMin = timeBounds.min + (timeBounds.max - timeBounds.min) * (timeRange[0] / 100);
    const tMax = timeBounds.min + (timeBounds.max - timeBounds.min) * (timeRange[1] / 100);
    const tickCount = Math.min(8, Math.max(3, Math.floor(plotW / 120)));
    ctx.font = '9px "JetBrains Mono", monospace';
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillStyle = "rgba(100,200,255,0.4)";

    for (let i = 0; i <= tickCount; i++) {
      const frac = i / tickCount;
      const x = MARGIN.left + frac * plotW;
      const t = tMin + frac * (tMax - tMin);
      const d = new Date(t);
      const label = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

      // Tick line
      ctx.strokeStyle = "rgba(100,200,255,0.1)";
      ctx.beginPath();
      ctx.moveTo(x, MARGIN.top);
      ctx.lineTo(x, MARGIN.top + plotH);
      ctx.stroke();

      ctx.fillText(label, x, MARGIN.top + plotH + 8);
    }

    // Axis labels
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.fillStyle = "rgba(100,200,255,0.3)";
    ctx.textAlign = "center";
    ctx.fillText("TIME →", MARGIN.left + plotW / 2, MARGIN.top + plotH + 28);

    ctx.save();
    ctx.translate(12, MARGIN.top + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText("CATEGORY", 0, 0);
    ctx.restore();

    // Draw connection wires
    const posMap = new Map(nodePositions.map((p) => [p.entry.id, p]));
    intelConnections.forEach((conn) => {
      const src = posMap.get(conn.source_entry_id);
      const tgt = posMap.get(conn.target_entry_id);
      if (!src || !tgt) return;

      const wireColor = conn.connection_type === "contradiction" ? "#ef4444"
        : conn.connection_type === "financial" ? "#eab308"
        : conn.connection_type === "social" ? "#a855f7"
        : "#00d4ff";

      ctx.strokeStyle = wireColor;
      ctx.lineWidth = 0.8;
      ctx.globalAlpha = 0.35;
      ctx.shadowColor = wireColor;
      ctx.shadowBlur = 4;

      // Circuit-board style: right-angle path
      const midX = (src.x + tgt.x) / 2;
      ctx.beginPath();
      ctx.moveTo(src.x, src.y);
      ctx.lineTo(midX, src.y);
      ctx.lineTo(midX, tgt.y);
      ctx.lineTo(tgt.x, tgt.y);
      ctx.stroke();

      // Junction dot at bend
      ctx.fillStyle = wireColor;
      ctx.beginPath();
      ctx.arc(midX, (src.y + tgt.y) / 2, 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
    });

    // Draw nodes
    nodePositions.forEach(({ entry, x, y, node }) => {
      const color = NODE_COLORS[node.type] || "#64748b";
      const statusColor = STATUS_COLORS[entry.fact_check_status] || "#64748b";
      const isHovered = `intel-${entry.id}` === hoveredId;
      const credibility = entry.credibility_score ?? 50;
      const size = 6 + (credibility / 100) * 8;

      // Glow
      ctx.shadowColor = color;
      ctx.shadowBlur = isHovered ? 18 : 6;

      // Outer rect (circuit board style)
      const w = size * 2.5;
      const h = size * 1.8;
      ctx.strokeStyle = color;
      ctx.lineWidth = isHovered ? 2 : 1;
      ctx.strokeRect(x - w / 2, y - h / 2, w, h);

      // Fill with credibility-based opacity
      ctx.fillStyle = `${color}${Math.round(15 + (credibility / 100) * 25).toString(16).padStart(2, "0")}`;
      ctx.fillRect(x - w / 2, y - h / 2, w, h);

      // Status indicator dot (top-right corner)
      ctx.shadowBlur = 0;
      ctx.fillStyle = statusColor;
      ctx.beginPath();
      ctx.arc(x + w / 2 - 3, y - h / 2 + 3, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Connection pins
      ctx.fillStyle = color;
      ctx.fillRect(x - 1, y - h / 2 - 4, 2, 4);
      ctx.fillRect(x - 1, y + h / 2, 2, 4);

      // Label
      const fontSize = isHovered ? 9 : 7;
      ctx.font = `${fontSize}px "JetBrains Mono", monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = isHovered ? color : `${color}cc`;
      ctx.fillText(node.label, x, y);

      ctx.shadowBlur = 0;
    });

    // Empty state
    if (nodePositions.length === 0 && intelEntries.length === 0) {
      ctx.font = '14px "JetBrains Mono", monospace';
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "rgba(100,200,255,0.3)";
      ctx.fillText("NO INTEL DATA — INGEST INTELLIGENCE TO POPULATE", dimensions.width / 2, dimensions.height / 2);
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.fillStyle = "rgba(100,200,255,0.15)";
      ctx.fillText("Use Bridge Import or the Dashboard to add entries", dimensions.width / 2, dimensions.height / 2 + 24);
    } else if (nodePositions.length === 0) {
      ctx.font = '12px "JetBrains Mono", monospace';
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "rgba(100,200,255,0.3)";
      ctx.fillText("NO ENTRIES IN SELECTED TIME RANGE / FILTERS", dimensions.width / 2, dimensions.height / 2);
    }

    ctx.restore();
  }, [dimensions, nodePositions, hoveredId, timeBounds, timeRange, plotW, plotH, laneHeight, laneDensity, pan, intelEntries.length, intelConnections]);

  // Hit detection
  const handleCanvasMove = useCallback((e: React.MouseEvent) => {
    if (isPanning) {
      setPan({
        x: e.clientX - panStart.current.x + panStart.current.panX,
        y: e.clientY - panStart.current.y + panStart.current.panY,
      });
      return;
    }
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mx = e.clientX - rect.left - pan.x;
    const my = e.clientY - rect.top - pan.y;

    let found: string | null = null;
    for (const { entry, x, y } of nodePositions) {
      const credibility = entry.credibility_score ?? 50;
      const size = 6 + (credibility / 100) * 8;
      const w = size * 2.5;
      const h = size * 1.8;
      if (mx >= x - w / 2 && mx <= x + w / 2 && my >= y - h / 2 && my <= y + h / 2) {
        found = `intel-${entry.id}`;
        break;
      }
    }
    setHoveredId(found);
    if (canvasRef.current) canvasRef.current.style.cursor = found ? "pointer" : isPanning ? "grabbing" : "grab";
  }, [nodePositions, pan, isPanning]);

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mx = e.clientX - rect.left - pan.x;
    const my = e.clientY - rect.top - pan.y;

    for (const { entry, x, y, node } of nodePositions) {
      const credibility = entry.credibility_score ?? 50;
      const size = 6 + (credibility / 100) * 8;
      const w = size * 2.5;
      const h = size * 1.8;
      if (mx >= x - w / 2 && mx <= x + w / 2 && my >= y - h / 2 && my <= y + h / 2) {
        onNodeClick(node);
        return;
      }
    }
    onNodeClick(null);
  }, [nodePositions, onNodeClick, pan]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (hoveredId) return; // Don't pan if over a node
    setIsPanning(true);
    panStart.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
  }, [hoveredId, pan]);

  const handleMouseUp = useCallback(() => setIsPanning(false), []);

  return (
    <div ref={containerRef} className="w-full h-full relative">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ width: dimensions.width, height: dimensions.height }}
        onMouseMove={handleCanvasMove}
        onClick={handleCanvasClick}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />

      {/* Time range slider */}
      <div className="absolute bottom-3 left-36 right-12 flex items-center gap-3 z-10">
        <span className="font-mono text-[8px] text-muted-foreground tracking-widest shrink-0">TIME RANGE</span>
        <Slider
          min={0}
          max={100}
          step={1}
          value={timeRange}
          onValueChange={(v) => setTimeRange(v as [number, number])}
          className="flex-1"
        />
        <span className="font-mono text-[8px] text-muted-foreground tracking-wider shrink-0">
          {visibleEntries.length}/{entriesWithDates.length}
        </span>
      </div>

      {/* Status legend */}
      <div className="absolute top-3 right-3 flex items-center gap-3 z-10">
        {Object.entries(STATUS_COLORS).map(([status, color]) => (
          <div key={status} className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
            <span className="font-mono text-[8px] text-muted-foreground tracking-wider">{status.toUpperCase()}</span>
          </div>
        ))}
      </div>
    </div>
  );
});
