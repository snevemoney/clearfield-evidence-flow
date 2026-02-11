

# Integrate Live Intel Data Into Existing Pages (Remove Intel Hub)

## What Changes

Remove the standalone Intelligence Hub page and instead wire the `intel_entries` database data directly into the pages you already have. Each page will automatically query and merge live intel data alongside the existing demo data -- no manual buttons needed.

## Pages Updated

### 1. Index Page (Dashboard)
- Stats cards pull real counts from `intel_entries` (e.g., active claims, evidence objects, persons tracked)
- Live Feed section shows the most recent intel entries with fact-check status badges (verified/disputed/unverified)
- "What We Don't Know" panel shows real counts: verified facts, disputed claims, unverified items, etc.

### 2. Graph Page
- Fetches `intel_entries` with categories matching graph node types (person, institution, event, document, claim)
- Merges them into the force graph as new nodes alongside existing demo nodes
- Fetches `intel_connections` to render as new edges between intel-sourced nodes
- Color-codes intel nodes with a subtle indicator showing they came from live data

### 3. Globe Page
- Fetches `intel_entries` that have `lat`/`lng` values
- Renders them as additional location markers on the globe
- Adds their coordinates to the heatmap layer for density visualization
- Updates the location count in the header dynamically

### 4. Timeline Page
- Fetches `intel_entries` that have `published_at` dates
- Renders them as additional events on the timeline river
- Color-codes by `fact_check_status` (verified = green, disputed = amber, unverified = slate)
- Merges with existing demo timeline data

### 5. Nexus Page
- Fetches `intel_entries` tagged with "epstein" and groups them by category
- Adds an "Epstein Network" topic universe populated from database entries
- Entities become nodes on the radial visualization

## Removals
- Delete the `/intelligence` route from `App.tsx`
- Remove the "INTEL HUB" nav item from `AppSidebar.tsx`
- The `IntelligenceHub.tsx` page file will be deleted
- Edge functions remain intact (they can still be called programmatically or by future automation)

## Technical Approach

Each page will use `@tanstack/react-query` with `useQuery` to fetch from the `intel_entries` table via the Supabase client. Data merging happens in the component -- demo data stays as the baseline, and live intel entries get appended/merged on top.

### Data Flow
- No manual triggers -- pages load intel data on mount automatically
- Queries are cached by react-query so navigation between pages is instant
- Each page only fetches the subset it needs (e.g., Globe only fetches entries with lat/lng)

### Files Modified
- `src/App.tsx` -- remove Intel Hub route and import
- `src/components/layout/AppSidebar.tsx` -- remove INTEL HUB nav item
- `src/pages/Index.tsx` -- add useQuery for intel stats and live feed
- `src/pages/Graph.tsx` and `src/components/graph/ConnectionWeb.tsx` -- merge intel nodes/edges
- `src/pages/GlobePage.tsx` -- merge intel locations and heatmap points
- `src/pages/Timeline.tsx` -- merge intel entries with dates into timeline
- `src/pages/NexusPage.tsx` and `src/lib/demo-nexus-data.ts` -- add Epstein Network topic universe from DB

### Files Deleted
- `src/pages/IntelligenceHub.tsx`
