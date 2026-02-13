

# Pre-Load Document Archive + Bulk OCR + Full-Text Search + Real-Time

## Overview

Three things happen in this implementation:
1. A backend function bulk-fetches real DOJ/Epstein court documents via Perplexity, then uses AI to extract page-level text with OCR-style detail and redaction detection -- populating the `documents` and `document_pages` tables at scale
2. The Search page becomes a full intelligence archive query interface with instant keyword search, redaction-aware results, and a page viewer
3. All existing pages get real-time subscriptions so new intel entries appear without refreshing

## Phase 1: `seed-document-archive` Edge Function

Creates a new edge function that populates the archive in bulk:

- Accepts `{ topics?: string[] }` -- defaults to a comprehensive Epstein document set (flight logs, black book, court filings, victim depositions, financial records, Maxwell trial exhibits, etc.)
- For each topic, queries Perplexity (sonar-pro) for real document metadata, case numbers, excerpts
- Sends results to Lovable AI (gemini-3-flash-preview) with a tool-call schema to extract structured output:
  - Per-document: title, source, estimated page count
  - Per-page: extracted text content (OCR-style), redaction detection (has_redactions, redaction_count), key entities mentioned
- Inserts into `documents` table (one row per document) and `document_pages` table (multiple rows per document)
- The existing `search_vector` trigger auto-indexes all text for full-text search
- Also creates corresponding `intel_entries` for cross-referencing with the rest of the platform
- Processes multiple topics in sequence, each generating 10-20 documents with 5-15 pages each
- Can be called repeatedly to grow the archive

**Default topics** (when called with empty body):
- "Jeffrey Epstein court filings case numbers 2019"
- "Epstein flight logs Lolita Express passenger manifests"
- "Ghislaine Maxwell trial exhibits evidence"
- "Epstein black book contacts names"
- "Epstein victim depositions testimony"
- "Epstein financial records shell companies"
- "DOJ Epstein investigation declassified documents"
- "Epstein island visitor logs records"

## Phase 2: Search Page Overhaul

Complete redesign of `src/pages/SearchPage.tsx`:

**Header**: "DOCUMENT ARCHIVE" with live stats bar -- total documents, total pages, pages with redactions

**Search Bar**: Debounced input (300ms) calling the `search_documents` RPC. Placeholder: "Search names, case numbers, locations..."

**Filter Chips**: ALL | DOCUMENTS | INTEL | REDACTED ONLY

**Results List** (two types merged):
- **Document Page Results**: Document title, page number badge (e.g., "PAGE 14 OF 89"), text snippet with search terms highlighted in cyan, redaction indicator (black bar icon + count like "7 REDACTIONS"), source badge, relevance score
- **Intel Entry Results**: Matching `intel_entries` shown with fact-check status badges (verified/disputed/unverified)

**Page Viewer Modal**: Clicking a document result opens a dialog showing:
- Full extracted text for that page with search term highlighting
- Redaction count and visual indicator
- Prev/next page navigation within the same document
- Document metadata header (title, source, total pages)

**Seed Archive Button**: Small button in the header area to trigger the `seed-document-archive` function (one-click to populate the archive)

### Supporting files:
- `src/hooks/use-document-search.ts` -- debounced search hook using `supabase.rpc("search_documents")` + `intel_entries` ilike query
- `src/components/search/SearchResults.tsx` -- results list with highlighting and redaction indicators
- `src/components/search/PageViewerModal.tsx` -- page detail dialog

## Phase 3: Real-Time Subscriptions

**Database migration**: Enable realtime on three tables:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE intel_entries;
ALTER PUBLICATION supabase_realtime ADD TABLE documents;
ALTER PUBLICATION supabase_realtime ADD TABLE document_pages;
```

**New hook**: `src/hooks/use-intel-realtime.ts`
- Exports `useIntelEntriesRealtime()` -- wraps `useIntelEntries()` with a Supabase channel subscription
- On `postgres_changes` INSERT events on `intel_entries`, invalidates the react-query cache via `queryClient.invalidateQueries(["intel_entries"])`
- Cleans up channel on unmount

**Pages updated** (swap `useIntelEntries` to `useIntelEntriesRealtime`):
- `src/pages/Index.tsx` (via `useIntelStats` -- will update the hook)
- `src/pages/GlobePage.tsx`
- `src/pages/Timeline.tsx`
- `src/components/graph/ConnectionWeb.tsx`
- `src/pages/NexusPage.tsx`

## Technical Details

### New Files
- `supabase/functions/seed-document-archive/index.ts`
- `src/hooks/use-intel-realtime.ts`
- `src/hooks/use-document-search.ts`
- `src/components/search/SearchResults.tsx`
- `src/components/search/PageViewerModal.tsx`

### Modified Files
- `src/pages/SearchPage.tsx` -- complete overhaul
- `src/hooks/use-intel-data.ts` -- add realtime-aware variants
- `src/pages/Index.tsx` -- use realtime hook
- `src/pages/GlobePage.tsx` -- use realtime hook
- `src/pages/Timeline.tsx` -- use realtime hook
- `src/components/graph/ConnectionWeb.tsx` -- use realtime hook
- `src/pages/NexusPage.tsx` -- use realtime hook
- `supabase/config.toml` -- add seed-document-archive function

### Database Migration
- Enable realtime on `intel_entries`, `documents`, `document_pages`

### No new dependencies needed
- Uses existing `@tanstack/react-query`, `@supabase/supabase-js`, `@radix-ui/react-dialog`, `lucide-react`, `framer-motion`

### Implementation Sequence
1. Database migration (enable realtime)
2. Edge function `seed-document-archive`
3. Realtime hook + update all pages
4. Search page overhaul (hooks, components, page)
5. Call `seed-document-archive` to populate the archive

