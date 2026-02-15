

# Consolidate CLEARFIELD from 14 Pages to 7

## Current Problem
The sidebar has 14 navigation items (plus Auth), which creates cognitive overload and makes it hard to find what you need. Many pages serve closely related purposes and share the same underlying data.

## Proposed Consolidation

```text
BEFORE (14 pages)                    AFTER (7 pages)
---------------------                ---------------------
DASHBOARD                       -->  DASHBOARD (unchanged)
CLAIMS                          -+
EVIDENCE                         +-> CASE FILE (3 tabs: Claims | Evidence | Contradictions)
CONTRADICTIONS                  -+
UNKNOWNS                        -+-> ANNOTATIONS (2 tabs: Unknowns | Context Notes)
CONTEXT NOTES                   -+
GRAPH                           -+
GLOBE                            +-> VISUALIZE (3 modes: Graph | Globe | Nexus)
THE NEXUS                       -+
TIMELINE                        -+-> TIMELINE (2 modes: River | Depth)
DEPTH VIEW                      -+
SEARCH                          -->  SEARCH (unchanged)
BRIDGE IMPORT                   -->  BRIDGE IMPORT (unchanged)
RABBIT HOLE                     -->  RABBIT HOLE (unchanged)
```

## Why These Groupings Make Sense

**Case File** (Claims + Evidence + Contradictions): These are all structured data objects in the investigation. Claims reference Evidence via the `claim_evidence` table. Contradictions compare sources. Users working on one almost always need the others. Merging them into tabs keeps everything in context.

**Annotations** (Unknowns + Context Notes): Both are commentary layers -- Unknowns track gaps in knowledge, Context Notes are user observations. They serve the same editorial function and are lightweight list views that work well as tabs.

**Visualize** (Graph + Globe + Nexus): Three different spatial visualizations of the same underlying intel data. A mode switcher at the top (similar to Graph's existing Web/Circuit toggle) keeps all exploration tools in one place.

**Timeline** (Timeline River + Depth/Iceberg): Both are alternative lenses on the same claims and events data -- one organized by time, the other by evidence density. A simple toggle switches between the two views.

## Technical Changes

### 1. New Combined Pages

**`src/pages/CaseFile.tsx`** -- New page with Tabs component
- Tab 1: "CLAIMS" -- contains current Claims.tsx content
- Tab 2: "EVIDENCE" -- contains current Evidence.tsx content  
- Tab 3: "CONTRADICTIONS" -- contains current Contradictions.tsx content
- Each tab's content is extracted into its own component file under `src/components/casefile/`

**`src/pages/Annotations.tsx`** -- New page with Tabs component
- Tab 1: "UNKNOWNS" -- contains current Unknowns.tsx content
- Tab 2: "CONTEXT NOTES" -- contains current ContextNotes.tsx content
- Content extracted into `src/components/annotations/`

**`src/pages/Visualize.tsx`** -- New page with mode switcher (similar to Graph's existing Web/Circuit toggle)
- Mode 1: "GRAPH" -- current Graph.tsx (Web + Circuit sub-modes preserved)
- Mode 2: "GLOBE" -- current GlobePage.tsx
- Mode 3: "NEXUS" -- current NexusPage.tsx
- Each mode is a full-screen visualization, toggled via header buttons

**`src/pages/Timeline.tsx`** -- Updated to include Depth View
- Mode 1: "RIVER" -- current Timeline view
- Mode 2: "DEPTH" -- current IcebergExplorer view
- Toggle in the header bar

### 2. Extract Page Content into Components

To keep files manageable, the current page content moves into reusable components:
- `src/components/casefile/ClaimsPanel.tsx`
- `src/components/casefile/EvidencePanel.tsx`
- `src/components/casefile/ContradictionsPanel.tsx`
- `src/components/annotations/UnknownsPanel.tsx`
- `src/components/annotations/ContextNotesPanel.tsx`
- `src/components/visualize/GraphView.tsx` (wraps existing Graph content)
- `src/components/visualize/GlobeView.tsx` (wraps existing GlobePage content -- renamed to avoid conflict with existing GlobeView component)
- `src/components/visualize/NexusView.tsx`
- `src/components/timeline/TimelineRiver.tsx`
- `src/components/timeline/DepthView.tsx`

### 3. Update Router (`src/App.tsx`)

Remove individual routes for merged pages and add new combined routes:
- `/casefile` -- CaseFile page (replaces `/claims`, `/evidence`, `/contradictions`)
- `/annotations` -- Annotations page (replaces `/notes`, `/unknowns`)
- `/visualize` -- Visualize page (replaces `/graph`, `/globe`, `/nexus`)
- `/timeline` -- Timeline page (already exists, now includes Depth View; removes `/iceberg`)
- Keep: `/`, `/search`, `/import`, `/rabbit-hole`

### 4. Update Sidebar (`src/components/layout/AppSidebar.tsx`)

New navigation items (7 instead of 14):
- DASHBOARD (`/`)
- CASE FILE (`/casefile`) -- icon: FileText
- ANNOTATIONS (`/annotations`) -- icon: MessageSquare
- VISUALIZE (`/visualize`) -- icon: GitBranch
- TIMELINE (`/timeline`) -- icon: Clock
- SEARCH (`/search`) -- icon: Search
- BRIDGE IMPORT (`/import`) -- icon: Import
- RABBIT HOLE (`/rabbit-hole`) -- icon: Rabbit

### 5. Update Cross-Reference Navigation

Any existing cross-reference links (query params like `?search=` on Globe, `?topic=` on Nexus) need to point to the new combined routes with an additional mode parameter, e.g., `/visualize?mode=globe&search=epstein`.

### 6. Delete Old Page Files

Remove after migration:
- `src/pages/Claims.tsx`
- `src/pages/Evidence.tsx`
- `src/pages/Contradictions.tsx`
- `src/pages/Unknowns.tsx`
- `src/pages/ContextNotes.tsx`
- `src/pages/Graph.tsx`
- `src/pages/GlobePage.tsx`
- `src/pages/NexusPage.tsx`
- `src/pages/IcebergExplorer.tsx`

### 7. No Database Changes

All data queries remain the same. Only the UI organization changes.

## Result

The sidebar shrinks from 14 items to 7, making the app feel more focused. Every feature is still accessible -- just organized into logical groups with tabs or mode switches. The user flow becomes: import data, view it in the case file, explore it visually, and annotate it.

