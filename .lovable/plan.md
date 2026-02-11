
# Connect All Visualizations Together

## Overview
Add cross-navigation buttons to the detail panels in the Graph, Globe, and Nexus views so users can seamlessly jump between visualizations for any topic. Clicking a node in the Graph will offer "Open in Nexus" and "Start Rabbit Hole" buttons. The same links will be added to the Globe and Nexus detail panels.

## Changes

### 1. `src/components/graph/NodeDetailPanel.tsx`
- Add two action buttons below the connections list:
  - **"EXPLORE IN NEXUS"** (Orbit icon) -- navigates to `/nexus?topic={node.label}`
  - **"START RABBIT HOLE"** (Rabbit icon) -- navigates to `/rabbit-hole?topic={node.label}`
- Use `react-router-dom`'s `useNavigate` hook for navigation
- Buttons styled as bordered mono-text action rows with icons, matching existing panel aesthetic

### 2. `src/components/globe/LocationDetailPanel.tsx`
- Add two similar action buttons:
  - **"EXPLORE IN NEXUS"** -- `/nexus?topic={location.label}`
  - **"START RABBIT HOLE"** -- `/rabbit-hole?topic={location.label}`
- Placed below the evidence references section, before the disclaimer

### 3. `src/components/nexus/NexusDetailPanel.tsx`
- Add action buttons:
  - **"VIEW ON GLOBE"** (Globe icon) -- `/globe?search={node.label}`
  - **"START RABBIT HOLE"** (Rabbit icon) -- `/rabbit-hole?topic={node.label}`
- Placed below the "Explore Deeper" section

### 4. `src/components/globe/QueryResultPanel.tsx`
- Add small action icons next to each AI-generated location in the list:
  - Rabbit icon to start a Rabbit Hole on that location's label
- Uses `useNavigate`

### 5. `src/pages/RabbitHolePage.tsx`
- Read `topic` from URL query params (`useSearchParams`)
- If present, auto-populate the topic input and trigger exploration on mount

### 6. `src/pages/NexusPage.tsx`
- Read `topic` from URL query params
- If it matches a known topic universe key or label, auto-navigate to that universe on mount

### 7. `src/pages/GlobePage.tsx`
- Read `search` from URL query params
- If present, auto-trigger the AI globe query on mount with that search term

## Technical Details
- All navigation uses `useNavigate` from `react-router-dom` with query params
- No new dependencies needed
- Button styling follows existing panel patterns: `border border-border rounded-sm p-2 bg-secondary/30 hover:bg-secondary/60 transition-all font-mono text-[10px]`
- Cross-nav section header: `"CROSS-REFERENCE"` in the standard tracking-widest muted style
- Each receiving page reads query params with `useSearchParams` and triggers the relevant action if params exist
