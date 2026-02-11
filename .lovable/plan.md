

# AI-Powered Globe Query System

## Overview
Add a command bar to the Globe page where users can ask natural language questions like "Where is Jeffrey Epstein's island?" or "Where do the most powerful people live?" The AI generates location data (points, heatmaps, arcs) on demand and the globe renders them live, flying the camera to the relevant region.

## How It Works

1. User types a question into a search/command bar overlaid on the globe
2. A new edge function (`globe-query`) sends the question to Lovable AI
3. The AI returns structured JSON: locations (lat/lng, label, description, category), heatmap points, arcs, and a camera target
4. The globe renders the AI-generated data as a new overlay layer (distinct color scheme -- magenta/pink to distinguish from static demo data)
5. The camera flies to the primary region of interest
6. A response summary panel shows what the AI found, with source caveats

## New Files

### 1. `supabase/functions/globe-query/index.ts`
- Receives `{ query: string }` from the client
- System prompt instructs the AI to return structured geographic data:
  - `locations[]`: lat, lng, label, description, category, weight
  - `heatmapPoints[]`: lat, lng, weight (for density queries like "where do powerful people live")
  - `arcs[]`: start/end coordinates, label, description (for relationship queries)
  - `camera`: lat, lng, altitude (where to fly the globe)
  - `summary`: 2-3 sentence plain text summary of the answer
  - `mode`: "points" | "heatmap" | "arcs" | "mixed" (tells the UI which layers to activate)
- Uses tool calling for structured output (same pattern as rabbit-hole)
- Handles 429/402 rate limit errors

### 2. `src/components/globe/GlobeQueryBar.tsx`
- Floating command bar at the bottom-center of the globe (overlaid on the canvas)
- Dark translucent glass design matching CLEARFIELD aesthetic
- Input field with placeholder: "ASK THE GLOBE..."
- Submit button with a sparkle/brain icon
- Loading state: pulsing cyan border animation while AI processes
- Example query chips below the input: "Epstein Island", "Five Eyes bases", "Billionaire residences", "Nuclear facilities"
- Keyboard shortcut: Enter to submit

### 3. `src/components/globe/QueryResultPanel.tsx`
- Slides in from the left when AI results arrive (opposite side from LocationDetailPanel)
- Shows:
  - The user's query
  - AI summary text
  - Count of locations/arcs/heatmap points generated
  - "CLEAR RESULTS" button to remove the AI overlay
  - Disclaimer: "AI-generated locations. Verify with primary sources."
- Lists each AI-generated location as a clickable item (clicking flies camera there)

## Modified Files

### `src/pages/GlobePage.tsx`
- Add state for AI query results: `aiLocations`, `aiHeatmap`, `aiArcs`, `isQuerying`, `queryResult`
- Render `GlobeQueryBar` with `onQuery` callback
- Render `QueryResultPanel` when results exist
- Merge AI-generated data with existing demo data when passing to `GlobeView`
- Add "CLEAR AI" button in the filter bar when AI results are active
- Camera fly-to when AI returns a camera target

### `src/components/globe/GlobeView.tsx`
- Accept new optional props: `aiLocations`, `aiHeatmapPoints`, `aiArcs`
- Merge AI locations into `pointsData` (AI points get a distinct magenta/pink color and a pulsing size)
- Merge AI heatmap points into `hexBinPointsData`
- Merge AI arcs into `arcsData` (AI arcs get a distinct dashed pink style)
- Expose `flyTo(lat, lng, altitude)` method via a new prop callback (`onReady`) or by accepting a `cameraTarget` prop that triggers `pointOfView()` when it changes

### `src/lib/demo-globe-data.ts`
- Add `AiGlobeLocation` type (similar to `GlobeLocation` but with `weight` field and `isAiGenerated: true` flag)
- Add helper function `aiLocationToGlobeLocation()` to convert AI results into the existing format

## User Experience Flow

1. User sees the globe with existing static data
2. User clicks the query bar and types "Where is Jeffrey Epstein's island?"
3. Loading animation plays (pulsing border, "ANALYZING..." text)
4. AI returns: Little St. James island (18.3, -64.83), nearby locations (New York townhouse, Palm Beach estate, Zorro Ranch), connections between them
5. Globe flies to the Caribbean, new pink markers appear on the island and related locations
6. Query result panel slides in showing the AI's summary
7. User can click any result to fly there, or "CLEAR" to remove AI overlay
8. User asks another question -- previous AI results are replaced

## Technical Details

- Edge function uses tool calling (same as rabbit-hole) for reliable structured output
- AI locations are rendered with `isAiGenerated: true` flag so they get distinct styling
- Camera animation uses existing `globeRef.current.pointOfView()` with 1200ms transition
- AI heatmap points use a pink/magenta color scheme instead of cyan
- Rate limit (429) and credit (402) errors show toast notifications
- Query bar debounces rapid submissions (1s cooldown)
