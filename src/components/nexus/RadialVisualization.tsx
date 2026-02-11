import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { type NexusNode, type TopicUniverse, RING_COLORS, RING_LABELS } from "@/lib/demo-nexus-data";

interface RadialVisualizationProps {
  universe: TopicUniverse;
  onNodeClick: (node: NexusNode) => void;
  onRecenter: (topicId: string) => void;
}

const SVG_SIZE = 700;
const CENTER = SVG_SIZE / 2;
const RING_RADII = [0, 130, 220, 310];
const NODE_RADIUS_BY_RING = [52, 32, 28, 24];

export function RadialVisualization({ universe, onNodeClick, onRecenter }: RadialVisualizationProps) {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  const ringNodes = useMemo(() => {
    return universe.rings.map((ring, ringIdx) =>
      ring.map((node, nodeIdx) => {
        const count = ring.length;
        const angle = (2 * Math.PI * nodeIdx) / count - Math.PI / 2;
        const r = RING_RADII[ringIdx + 1];
        return {
          ...node,
          x: CENTER + r * Math.cos(angle),
          y: CENTER + r * Math.sin(angle),
          angle,
          ringIndex: ringIdx + 1,
        };
      })
    );
  }, [universe]);

  const allPlacedNodes = useMemo(() => ringNodes.flat(), [ringNodes]);

  const handleNodeClick = useCallback(
    (node: NexusNode & { x: number; y: number }) => {
      if (node.children && node.children.length > 0) {
        onRecenter(node.children[0]);
      } else {
        onNodeClick(node);
      }
    },
    [onNodeClick, onRecenter]
  );

  return (
    <div className="relative flex items-center justify-center w-full h-full">
      <svg
        viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
        className="w-full h-full max-w-[700px] max-h-[700px]"
      >
        <defs>
          {/* Glow filters */}
          {Object.entries(RING_COLORS).map(([ring, color]) => (
            <filter key={ring} id={`glow-${ring}`} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feFlood floodColor={color} floodOpacity="0.6" />
              <feComposite in2="blur" operator="in" />
              <feMerge>
                <feMergeNode />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          ))}
          <filter id="glow-hover" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feFlood floodColor="#00e5ff" floodOpacity="0.8" />
            <feComposite in2="blur" operator="in" />
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Ring circles */}
        {RING_RADII.slice(1).map((r, i) => (
          <circle
            key={i}
            cx={CENTER}
            cy={CENTER}
            r={r}
            fill="none"
            stroke={RING_COLORS[i + 1]}
            strokeOpacity={0.12}
            strokeWidth={1}
            strokeDasharray="4 6"
          />
        ))}

        {/* Connection lines from center to ring 1 */}
        {ringNodes[0]?.map((node) => (
          <line
            key={`line-c-${node.id}`}
            x1={CENTER}
            y1={CENTER}
            x2={node.x}
            y2={node.y}
            stroke={RING_COLORS[1]}
            strokeOpacity={hoveredNode === node.id ? 0.5 : 0.1}
            strokeWidth={hoveredNode === node.id ? 1.5 : 0.5}
          />
        ))}

        {/* Connection lines ring 1 → ring 2 (nearest neighbor mapping) */}
        {ringNodes[1]?.map((claimNode) => {
          const nearest = ringNodes[0]?.reduce((best, evNode) => {
            const d = Math.hypot(evNode.x - claimNode.x, evNode.y - claimNode.y);
            return d < best.d ? { node: evNode, d } : best;
          }, { node: ringNodes[0][0], d: Infinity });
          return (
            <line
              key={`line-1-${claimNode.id}`}
              x1={nearest.node.x}
              y1={nearest.node.y}
              x2={claimNode.x}
              y2={claimNode.y}
              stroke={RING_COLORS[2]}
              strokeOpacity={hoveredNode === claimNode.id ? 0.4 : 0.07}
              strokeWidth={0.5}
            />
          );
        })}

        {/* Connection lines ring 2 → ring 3 */}
        {ringNodes[2]?.map((connNode) => {
          const nearest = ringNodes[1]?.reduce((best, claimNode) => {
            const d = Math.hypot(claimNode.x - connNode.x, claimNode.y - connNode.y);
            return d < best.d ? { node: claimNode, d } : best;
          }, { node: ringNodes[1][0], d: Infinity });
          return (
            <line
              key={`line-2-${connNode.id}`}
              x1={nearest.node.x}
              y1={nearest.node.y}
              x2={connNode.x}
              y2={connNode.y}
              stroke={RING_COLORS[3]}
              strokeOpacity={hoveredNode === connNode.id ? 0.4 : 0.07}
              strokeWidth={0.5}
            />
          );
        })}

        {/* Ring label arcs */}
        {RING_RADII.slice(1).map((r, i) => (
          <text
            key={`rlabel-${i}`}
            x={CENTER}
            y={CENTER - r + 12}
            textAnchor="middle"
            fill={RING_COLORS[i + 1]}
            fillOpacity={0.35}
            fontSize={8}
            fontFamily="monospace"
            letterSpacing={3}
          >
            {RING_LABELS[i + 1]}
          </text>
        ))}

        {/* Ring nodes */}
        <AnimatePresence mode="wait">
          {allPlacedNodes.map((node) => {
            const isHovered = hoveredNode === node.id;
            const hasChildren = node.children && node.children.length > 0;
            const nr = NODE_RADIUS_BY_RING[node.ringIndex];
            return (
              <motion.g
                key={node.id}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ duration: 0.4, delay: node.ringIndex * 0.08 }}
                style={{ cursor: "pointer" }}
                onMouseEnter={() => setHoveredNode(node.id)}
                onMouseLeave={() => setHoveredNode(null)}
                onClick={() => handleNodeClick(node)}
              >
                {/* Node circle */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={isHovered ? nr + 3 : nr}
                  fill={`${node.color}${isHovered ? "30" : "15"}`}
                  stroke={node.color}
                  strokeWidth={isHovered ? 2 : 1}
                  strokeOpacity={isHovered ? 1 : 0.5}
                  filter={isHovered ? "url(#glow-hover)" : undefined}
                />
                {/* Navigate indicator for nodes with children */}
                {hasChildren && (
                  <circle
                    cx={node.x + nr - 6}
                    cy={node.y - nr + 6}
                    r={4}
                    fill={node.color}
                    fillOpacity={0.8}
                  />
                )}
                {/* Label */}
                <text
                  x={node.x}
                  y={node.y - 4}
                  textAnchor="middle"
                  fill={isHovered ? "#e2e8f0" : "#94a3b8"}
                  fontSize={nr > 28 ? 9 : 7.5}
                  fontFamily="monospace"
                  fontWeight={isHovered ? "bold" : "normal"}
                >
                  {node.label.length > 16 ? node.label.slice(0, 14) + "…" : node.label}
                </text>
                {/* Source count */}
                <text
                  x={node.x}
                  y={node.y + 9}
                  textAnchor="middle"
                  fill={node.color}
                  fillOpacity={0.7}
                  fontSize={7}
                  fontFamily="monospace"
                >
                  {node.sourceCount} src
                </text>
              </motion.g>
            );
          })}
        </AnimatePresence>

        {/* Center node */}
        <motion.g
          key={universe.center.id}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
        >
          <circle
            cx={CENTER}
            cy={CENTER}
            r={NODE_RADIUS_BY_RING[0]}
            fill="rgba(0,229,255,0.1)"
            stroke="#00e5ff"
            strokeWidth={2}
            filter="url(#glow-0)"
          />
          <text
            x={CENTER}
            y={CENTER - 8}
            textAnchor="middle"
            fill="#00e5ff"
            fontSize={11}
            fontFamily="monospace"
            fontWeight="bold"
          >
            {universe.center.label.length > 18
              ? universe.center.label.slice(0, 16) + "…"
              : universe.center.label}
          </text>
          <text
            x={CENTER}
            y={CENTER + 6}
            textAnchor="middle"
            fill="#00e5ff"
            fillOpacity={0.6}
            fontSize={8}
            fontFamily="monospace"
          >
            {universe.center.sourceCount} sources
          </text>
          <text
            x={CENTER}
            y={CENTER + 18}
            textAnchor="middle"
            fill="#94a3b8"
            fontSize={7}
            fontFamily="monospace"
          >
            ● CENTER TOPIC
          </text>
        </motion.g>
      </svg>

      {/* Hover tooltip */}
      <AnimatePresence>
        {hoveredNode && (() => {
          const node = allPlacedNodes.find((n) => n.id === hoveredNode);
          if (!node) return null;
          return (
            <motion.div
              key={hoveredNode}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-card/95 border border-border backdrop-blur-sm rounded-sm px-4 py-2 max-w-xs pointer-events-none z-10"
            >
              <div className="flex items-center gap-2 mb-1">
                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: node.color }} />
                <span className="font-mono text-[9px] tracking-widest" style={{ color: node.color }}>
                  {node.type.toUpperCase()}
                </span>
              </div>
              <p className="font-mono text-[10px] font-bold text-foreground">{node.label}</p>
              <p className="font-mono text-[9px] text-muted-foreground mt-0.5">{node.description}</p>
              {node.children && node.children.length > 0 && (
                <p className="font-mono text-[8px] text-primary mt-1">▶ CLICK TO EXPLORE</p>
              )}
            </motion.div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}
