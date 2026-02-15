
# Clickable Intel Entry Detail Modal

## Overview
Add the ability to click on any intel entry item (in the Dashboard live feed and anywhere entries appear as list items) to open a detail modal showing full information and source links.

## What You'll Get
- Clicking any item in the **LIVE FEED** on the Dashboard opens a detail panel/modal
- The modal shows: full title, description, AI summary, category, fact-check status, credibility score, source type, source URL (clickable), tags, related entities, location coordinates, published date, and ingestion date
- If a `source_url` exists, a clickable "SOURCE" link is displayed prominently
- Cross-reference buttons to explore the entry in the Graph, Globe, or Nexus views

## Technical Details

### 1. New Component: `IntelDetailModal`
**File:** `src/components/intel/IntelDetailModal.tsx`

A reusable dialog component that accepts an `IntelEntry` object and displays:
- Status badge (verified/disputed/unverified) with icon
- Category and source type badges
- Full description text (not truncated)
- AI summary section (if available)
- Tags displayed as badge chips
- Related entities as clickable items
- Source URL as an external link button (if present)
- Credibility score indicator
- Location coordinates (if present) with "View on Globe" link
- Published date and ingestion timestamp
- Cross-reference navigation buttons (Explore in Nexus, View on Graph, Start Rabbit Hole)

Uses existing `Dialog` component from `@/components/ui/dialog` and follows the same monospace/dark styling as the rest of the app.

### 2. Update Dashboard (`src/pages/Index.tsx`)
- Add state: `selectedEntry` and `modalOpen`
- Make each live feed row a clickable `button` element with `cursor-pointer`
- On click, set the selected entry and open the `IntelDetailModal`
- Import and render the modal

### 3. Reusability
The `IntelDetailModal` component will be built as a standalone, reusable component so it can later be used from other pages (e.g., the search results intel items, timeline entries, etc.) without duplicating code.
