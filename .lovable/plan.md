

# Interactive Globe Map for CLEARFIELD

## Overview
Add an interactive 3D globe to CLEARFIELD using `react-globe.gl` -- a ThreeJS/WebGL-powered React component that supports country polygons, city points, arcs, heatmaps, and click interactions. This will be a new "GLOBE" page in the sidebar.

## What You'll Get
- A dark, rotating 3D globe matching the CLEARFIELD intelligence aesthetic
- Clickable countries that highlight and show event/evidence counts
- City markers for locations tied to evidence and claims in the database
- Zoom into any region by clicking (smooth camera animation)
- Event pins showing publicly documented locations from evidence objects
- Filter by evidence type, date range, and topic
- Detail panel (like the Evidence Graph) slides in when clicking a location
- All locations link back to source evidence -- no unsourced pins

## Technical Approach

### New dependency
- `react-globe.gl` -- lightweight React wrapper around globe.gl (ThreeJS-based)

### New files
1. **`src/pages/GlobePage.tsx`** -- Main page with the globe, filter bar, and detail panel
2. **`src/components/globe/GlobeView.tsx`** -- The react-globe.gl component configured with dark theme, country polygons (from public GeoJSON), city/event point layers, and click handlers
3. **`src/components/globe/LocationDetailPanel.tsx`** -- Slide-in panel showing evidence, claims, and context notes for a clicked location
4. **`src/lib/demo-globe-data.ts`** -- Demo dataset of real-world locations tied to existing demo evidence (e.g., Fort Meade/NSA, Mountain View/Google, Washington DC/Executive Orders)

### Modified files
- **`src/App.tsx`** -- Add `/globe` route
- **`src/components/layout/AppSidebar.tsx`** -- Add GLOBE nav item with Globe icon

### Globe configuration
- Dark globe texture (night-sky earth image from public CDN or embedded dark style)
- Country polygons with low-opacity borders, highlight on hover
- Atmosphere glow in cyan to match the CLEARFIELD palette
- Point markers styled as glowing dots (color-coded by evidence type)
- Click any point to zoom in and open the detail panel
- Labels layer for major cities when zoomed in
- Custom hex polygon layer ready for future heatmap features (Phase 2 enhancement)

### Demo data structure
Each location point will include:
- Latitude/longitude
- Label (location name)
- Category (institution, event, document origin)
- Linked evidence IDs (from existing demo data)
- Source count
- Color mapped to evidence type

### UI layout
- Full-height globe canvas with filter bar at top (matching Evidence Graph style)
- Filters: by evidence type, date range, topic
- Location detail panel slides in from the right (same pattern as NodeDetailPanel)
- Bottom watermark: "CLEARFIELD // GLOBAL INTELLIGENCE MAP // EVENT-BASED ONLY"

### Design details
- Globe background: transparent (inherits the dark grid-bg)
- Atmosphere: cyan glow
- Country borders: dim cyan lines
- Event markers: glowing colored dots with pulse animation
- Hover: country highlights with amber glow
- Click: smooth camera fly-to animation, detail panel opens

