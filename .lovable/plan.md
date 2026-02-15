

# Redesign Graph Views as Detective Investigation Boards

## Problem
Both graph views (Web and Intel/Circuit) suffer from poor spacing:
- **The Web**: Demo nodes cluster tightly in the center while imported intel nodes scatter far away with no connections to the core cluster. No visual hierarchy.
- **Intel View (Circuit)**: Nodes overlap and stack on top of each other. Labels are unreadable.
- Neither view looks like a proper detective investigation board with clear connections, readable labels, and good spacing.

## Solution
Tune the d3 force simulation parameters and redesign the canvas rendering to create a clean, well-spaced "detective web" aesthetic -- think red string on a corkboard, with clear node separation, curved connection lines, and visual hierarchy based on importance.

## Changes

### 1. ConnectionWeb.tsx -- Detective Investigation Board

**Force simulation tuning** (the key fix for spacing):
- Add `d3Force` callback to configure charge repulsion (`forceManyBody().strength(-300)`) so nodes push apart much more
- Set `forceLink().distance()` based on link type (contradictions longer, citations shorter) to create meaningful spacing
- Add `forceCollide()` with radius based on node size to prevent overlaps entirely
- Increase `d3AlphaDecay` to `0.03` for faster stabilization
- Add `warmupTicks={50}` to pre-simulate before rendering (no messy initial animation)

**Visual redesign -- detective board style**:
- Nodes: Draw as clean circles with a thin border ring, filled center dot, and label on a dark background "card" beneath (like a pinned photo/document on a corkboard)
- Size nodes by `sourceCount` more aggressively so important nodes are visibly larger
- Links: Replace straight lines with curved bezier lines (like string on a board). Use dashed lines for contradictions, solid for citations
- Add small directional arrows on link endpoints
- Draw edge-type label at midpoint of each link (small, subtle text like "FINANCIAL" or "CITATION")
- Intel nodes get a pulsing green border ring to distinguish live data

### 2. CircuitBoard.tsx -- Clean Grid-Aligned Intel View

**Force simulation tuning**:
- Add `d3Force` to set stronger charge repulsion (`-400`) and longer link distances (`120`)
- Add `forceCollide()` with generous radius (`30`) to prevent the current stacking/overlapping
- Increase `d3VelocityDecay` to `0.5` for less jittery movement

**Visual cleanup**:
- Make rectangles wider to fit labels without truncation (scale width by label length)
- Increase minimum spacing between circuit pins
- Draw right-angle link paths with more offset so parallel links don't overlap
- Add link-type indicators (small colored dots) at link midpoints

### 3. Shared Improvements (both views)

**Zoom-to-fit on load**: After the simulation stabilizes (`onEngineStop`), call `graphRef.current.zoomToFit(400, 60)` to auto-frame all nodes with padding. This ensures the user always sees the full graph nicely framed regardless of how many nodes exist.

**Node interaction polish**:
- On hover: Highlight the hovered node and all its direct connections, dim everything else (neighborhood highlight)
- Increase label font size on hover for readability

### 4. Files to Modify

| File | Change |
|------|--------|
| `src/components/graph/ConnectionWeb.tsx` | Force params, curved links, detective board node rendering, zoom-to-fit, hover highlight |
| `src/components/graph/CircuitBoard.tsx` | Force params, collision avoidance, wider nodes, cleaner link routing, zoom-to-fit |

No new dependencies needed -- all changes use the existing `react-force-graph-2d` API and canvas drawing.

