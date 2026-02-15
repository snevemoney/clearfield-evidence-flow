

# Differentiating The Web vs Intel View

## The Problem
Both graph modes share the same data model, filters, legend, search bar, and detail panel. The only differences are cosmetic (circles vs rectangles) and that The Web merges live database entries. This makes Intel View feel like a reskin rather than a distinct tool.

## Proposed Approach: Give Each View a Distinct Purpose

### Option A: Make Intel View the "Live-Only" Analytical View
Flip the data model so Intel View becomes the **database-focused** view while The Web remains the **reference/demo** view:

- **The Web** = Static reference graph (demo data only, as a baseline map of known connections)
- **Intel View** = Live intelligence feed (database entries only, no demo data) with additional analytical features:
  - Cluster detection highlighting (auto-group tightly connected nodes)
  - Timeline slider to filter nodes by ingestion date
  - Credibility heatmap coloring (nodes colored by their `credibility_score`)
  - Fact-check status badges on each node (verified/disputed/unverified)

### Option B: Merge Into One View With Style Toggle
Eliminate the mode switch entirely and keep a single graph view that:
- Shows all data (demo + live) in one unified graph
- Offers a visual style toggle (circle vs circuit board) as a cosmetic preference
- This simplifies the UI and removes user confusion

### Option C: Repurpose Intel View as a Temporal/Analytical Layer
Keep both views but make Intel View fundamentally different:
- **The Web** = Relationship map (current, spatial layout by connections)
- **Intel View** = Temporal analysis board:
  - X-axis = time (ingestion or publication date)
  - Y-axis = category or credibility
  - Nodes positioned by time rather than force-directed
  - Shows patterns like "burst of activity" or "gap in coverage"
  - Circuit board aesthetic fits this structured grid layout naturally

## Recommendation
**Option C** provides the most value — it gives Intel View a genuinely unique analytical purpose (temporal pattern analysis) that complements The Web's relationship mapping, and the circuit board aesthetic naturally suits a structured grid layout.

## Technical Details

### Files to modify:
- `src/components/graph/CircuitBoard.tsx` — Replace force-directed layout with a time-based axis layout; position nodes by `published_at` or `ingested_at` on X-axis and by category on Y-axis
- `src/pages/Visualize.tsx` — Update the Intel View description/label to reflect its new purpose (e.g., "TIMELINE ANALYSIS" or "TEMPORAL GRID")
- Connect CircuitBoard to live database data (currently only uses demo data) via the same realtime hooks ConnectionWeb uses

### New UI elements for Intel View:
- Time range slider (filter visible date range)
- Axis labels (time on X, category on Y)
- Density indicators showing clusters of activity

### Estimated scope:
- Moderate — primarily reworking the CircuitBoard positioning logic and adding time-axis rendering, plus a filter slider component

