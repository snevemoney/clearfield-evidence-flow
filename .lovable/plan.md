

# Add Full Realtime Sync Across All Pages

## Problem
Bridge Import writes to `evidence`, `intel_entries`, `timeline_events`, and `unknowns`, but the realtime subscription in `use-intel-realtime.ts` only listens to `intel_entries`, `documents`, and `document_pages`. This means most pages won't reflect new data until you manually refresh or navigate away and back.

## Solution
Expand the realtime subscription to cover all tables that Bridge Import (and other ingestion tools) write to, then wire up the affected pages to use realtime-aware queries.

## Changes

### 1. Expand Realtime Subscription (`src/hooks/use-intel-realtime.ts`)

Add listeners for these additional tables:
- `evidence`
- `unknowns`
- `timeline_events`
- `contradictions`
- `claims`
- `claim_evidence`
- `context_notes` (if applicable)

Each listener invalidates the matching React Query key so the page re-fetches automatically.

### 2. Enable Realtime on Tables (SQL Migration)

Run:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.evidence;
ALTER PUBLICATION supabase_realtime ADD TABLE public.unknowns;
ALTER PUBLICATION supabase_realtime ADD TABLE public.timeline_events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.contradictions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.claims;
ALTER PUBLICATION supabase_realtime ADD TABLE public.claim_evidence;
```

### 3. Wire Up Pages to Use Realtime Hook

For each page that queries these tables, add a call to `useRealtimeInvalidation()` (or a new exported hook) so the query cache is automatically refreshed:

- **Evidence** (`src/pages/Evidence.tsx`) -- listens for `evidence`, `claim_evidence`
- **Claims** (`src/pages/Claims.tsx`) -- listens for `claims`, `claim_evidence`, `evidence`
- **Unknowns** (`src/pages/Unknowns.tsx`) -- listens for `unknowns`
- **Contradictions** (`src/pages/Contradictions.tsx`) -- listens for `contradictions`, `intel_entries`
- **Context Notes** (`src/pages/ContextNotes.tsx`) -- listens for `evidence`
- **Timeline** (`src/pages/Timeline.tsx`) -- already has realtime for `intel_entries`, add `timeline_events`
- **Dashboard/Index** (`src/pages/Index.tsx`) -- already has realtime stats, will benefit from expanded listeners
- **Search** (`src/pages/SearchPage.tsx`) -- will pick up new `intel_entries` and `documents` via existing listeners
- **Graph, Globe, Nexus, Rabbit Hole** -- already wired via `intel_entries` realtime; no changes needed
- **Bridge Import** (`src/pages/BridgeImport.tsx`) -- no change needed (results come from the API response)
- **Depth View / Iceberg** (`src/pages/IcebergExplorer.tsx`) -- will check if it queries any of these tables

### 4. No Database Schema Changes
Only the realtime publication is updated. No new columns or tables.

## Result
After this change, pasting a chat in Bridge Import will cause every page in the app to automatically refresh its data within seconds -- no manual navigation or refresh needed.

