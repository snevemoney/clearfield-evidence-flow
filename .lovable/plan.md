

# Replace Temporal Grid with Shadow Board

## Overview
Remove the Temporal Grid and replace it with a **Shadow Board** -- a dark ops-style detective evidence wall where intel entries appear as pinned dossier cards connected by string lines, like a physical evidence board in a noir investigation room.

## What Gets Removed
- `src/components/graph/TemporalGrid.tsx` -- deleted entirely

## What Gets Created
- `src/components/graph/ShadowBoard.tsx` -- the new component

## Shadow Board Design

### Visual Concept
- Dark cork/slate background with subtle texture (CSS gradient noise)
- Intel entries rendered as **pinned cards** with:
  - Torn/rough edge styling (subtle box-shadow + border treatment)
  - Category-colored pin dot in the top corner
  - Title, truncated description, fact-check status badge
  - Credibility score bar along the bottom edge
  - Faint "CLASSIFIED" or category stamp watermark
- Connections rendered as **taut string lines** between cards (slightly curved, with a thumbtack dot at each end)
- String colors match connection type (red = contradiction, yellow = financial, purple = social, cyan = citation)

### Layout
- Canvas-based rendering (same pattern as other graph views) for performance
- Force-directed positioning so cards spread naturally but can be explored via pan/zoom
- Uses `react-force-graph-2d` like ConnectionWeb for consistency, with custom `nodeCanvasObject` rendering cards instead of circles

### Data Source
- Live database data via `useIntelEntriesRealtime` and `useIntelConnectionsRealtime` (same as the removed Temporal Grid)
- Falls back to an empty state message when no intel data exists

### Interactivity
- Click a card to open the NodeDetailPanel (same as other views)
- Hover highlights the card and its connected strings, dimming unrelated cards
- Pan and zoom supported
- Search bar integration (same `GraphHandle` interface)

## Files Modified
- **Delete**: `src/components/graph/TemporalGrid.tsx`
- **Create**: `src/components/graph/ShadowBoard.tsx`
- **Edit**: `src/pages/Visualize.tsx`
  - Replace `TemporalGrid` import with `ShadowBoard`
  - Rename the toggle button from "TEMPORAL GRID" to "SHADOW BOARD"
  - Swap the `Cpu` icon for a more fitting icon (e.g., `StickyNote` or keep `Cpu`)

## Technical Details

### ShadowBoard Component
- Uses `react-force-graph-2d` with `ForceGraph2D` (consistent with ConnectionWeb)
- Custom `nodeCanvasObject` draws each node as a rectangular "dossier card":
  - Dark fill with faint border glow matching category color
  - Pin circle at top-left
  - Title text, status badge, credibility bar
- Custom `linkCanvasObject` draws strings:
  - Slightly curved lines with pin dots at endpoints
  - Color-coded by connection type
  - Dashed for contradictions
- Implements `GraphHandle` interface (`focusNode`, `getNodes`) for search bar compatibility
- Hover highlighting with neighbor-based dimming (same pattern as ConnectionWeb)

### Force Configuration
- Charge strength: -500 (more spacing for larger card nodes)
- Link distance: 200 (room for string lines)
- Collision radius based on card size

