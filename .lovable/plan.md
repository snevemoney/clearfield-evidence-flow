

# Mass Document Ingestion, Full-Text Search, and Real-Time Subscriptions

## Overview

Three major capabilities:
1. **Mass Document Ingestion** -- Upload bulk PDFs/scans, OCR them, extract text, and store page-level content for search
2. **Full-Text Search with Page-Level Results** -- Instant keyword search across all ingested documents with page numbers, redaction detection, and scan previews
3. **Real-Time Subscriptions** -- All pages auto-update when new intel entries arrive (no refresh needed)

---

## Phase 1: Database Schema for Document Storage

New tables via migration:

### `documents`
Tracks each uploaded document (e.g., a single PDF from the DOJ Epstein release):
- `id` (uuid, PK)
- `title` (text) -- filename or descriptive name
- `source` (text) -- e.g., "DOJ Epstein Release Batch 3"
- `file_url` (text) -- URL in storage bucket
- `total_pages` (int)
- `status` (text: `pending`, `processing`, `completed`, `failed`)
- `metadata` (jsonb) -- any extra info (case number, date range, etc.)
- `created_at` (timestamptz)

### `document_pages`
One row per page of each document -- the core searchable unit:
- `id` (uuid, PK)
- `document_id` (uuid, FK -> documents)
- `page_number` (int)
- `extracted_text` (text) -- OCR / text extraction result
- `has_redactions` (boolean) -- AI-detected redaction bars
- `redaction_count` (int) -- number of redacted blocks detected
- `page_image_url` (text, nullable) -- URL to rendered page image in storage
- `created_at` (timestamptz)

### Full-Text Search Index
- Add a `tsvector` column `search_vector` on `document_pages` with a GIN index
- Create a trigger to auto-populate `search_vector` from `extracted_text` on INSERT/UPDATE
- Create a database function `search_documents(query text, result_limit int)` that uses `ts_rank` for relevance-ranked results joining back to document metadata

### Enable Realtime
- `ALTER PUBLICATION supabase_realtime ADD TABLE intel_entries;`
- `ALTER PUBLICATION supabase_realtime ADD TABLE documents;`
- `ALTER PUBLICATION supabase_realtime ADD TABLE document_pages;`

### RLS
- All tables publicly readable (SELECT)
- INSERT/UPDATE restricted to service role

---

## Phase 2: Storage Bucket

Create a `documents` storage bucket (public) for:
- Uploaded PDF files
- Rendered page images (PNG thumbnails of each page scan)

---

## Phase 3: Edge Functions

### `ingest-bulk-documents` Edge Function
Accepts a list of file URLs (from storage bucket) and processes them:
1. For each PDF URL, fetch the file
2. Use Lovable AI (gemini-2.5-flash) to:
   - Extract text from each page (OCR for scanned docs)
   - Detect redactions (black bars/blocks) and count them
   - Flag pages with heavy redaction
3. Store each page's text in `document_pages`
4. Create corresponding `intel_entries` for key findings (names, events, dates extracted)
5. Log the run in `ingestion_runs`

The function processes in batches (e.g., 10 pages at a time) to stay within edge function timeouts. For very large documents, it accepts a `start_page` / `end_page` range so the frontend can chunk requests.

### `search-documents` Edge Function
A lightweight wrapper that calls the `search_documents` database function:
- Accepts `query` (string) and `limit` (int)
- Returns ranked results with: page text snippet (highlighted), page number, document title, redaction info, page image URL
- Supports filters: `source`, `has_redactions`, `date_range`

---

## Phase 4: Search Page Overhaul (`src/pages/SearchPage.tsx`)

Transform the empty placeholder into a powerful document search interface:

### Search Bar
- Debounced input (300ms) -- type a name, get instant hits
- Shows result count and search time
- Filter chips: "All", "Documents", "Intel Entries", "Redacted Only"

### Results Display
- **Document Page Results**: Each result shows:
  - Document title + page number badge
  - Text snippet with search terms highlighted in cyan
  - Redaction indicator (black bar icon + count if redacted)
  - "VIEW PAGE" button that opens the page scan image in a modal
  - Credibility/source badge
- **Intel Entry Results**: Existing intel entries matching the query, shown with fact-check status badges
- Results sorted by relevance (ts_rank score)

### Page Viewer Modal
- When clicking a result, opens a modal showing:
  - The actual page scan image (from storage)
  - Extracted text overlay (toggleable)
  - Redacted sections visually marked with black bars
  - Navigation: prev/next page within the same document
  - "LINK TO INTEL" button to create an intel_entry from the page

### Stats Bar
- Total documents ingested, total pages, pages with redactions, last ingestion time

---

## Phase 5: Real-Time Subscriptions

### Hook: `src/hooks/use-intel-realtime.ts`
- Wraps `useIntelEntries` with a Supabase realtime channel subscription
- Listens for `INSERT` events on `intel_entries` table
- On new entry, invalidates the react-query cache so all pages refresh automatically
- Also subscribes to `documents` and `document_pages` for document ingestion progress

### Pages Updated
- **Index (Dashboard)**: Live feed auto-updates as new entries arrive -- no refresh
- **Graph, Globe, Timeline, Nexus**: All use the same `useIntelEntries` hook, so cache invalidation propagates everywhere
- **Search Page**: Document results update as new pages are OCR'd and indexed

### Implementation
Each page that uses `useIntelEntries()` will switch to `useIntelEntriesRealtime()` which:
1. Sets up a Supabase channel on mount
2. On `postgres_changes` INSERT event, calls `queryClient.invalidateQueries(["intel_entries"])`
3. Cleans up channel on unmount

---

## Phase 6: Document Upload UI (on Search Page)

A collapsible "INGEST DOCUMENTS" panel at the top of the Search page:
- Drag-and-drop zone for PDF files (uses storage bucket upload)
- Bulk upload: select multiple files at once
- Source label input (e.g., "DOJ Epstein Release 2024")
- Progress bar showing: files uploaded, pages processed, pages remaining
- Real-time status updates as the edge function processes pages

---

## Technical Details

### Files Created
- `supabase/functions/ingest-bulk-documents/index.ts` -- bulk PDF processing edge function
- `supabase/functions/search-documents/index.ts` -- full-text search edge function
- `src/hooks/use-intel-realtime.ts` -- realtime subscription hook
- `src/hooks/use-document-search.ts` -- search query hook with debounce
- `src/components/search/SearchResults.tsx` -- results list component
- `src/components/search/PageViewerModal.tsx` -- page scan viewer modal
- `src/components/search/DocumentUpload.tsx` -- bulk upload component

### Files Modified
- `src/pages/SearchPage.tsx` -- complete overhaul with search + upload + results
- `src/pages/Index.tsx` -- switch to realtime hook
- `src/pages/GlobePage.tsx` -- switch to realtime hook
- `src/pages/Timeline.tsx` -- switch to realtime hook
- `src/components/graph/ConnectionWeb.tsx` -- switch to realtime hook
- `src/pages/NexusPage.tsx` -- switch to realtime hook
- `src/hooks/use-intel-data.ts` -- add realtime variant
- `supabase/config.toml` -- add new edge function configs

### Database Migration
- Create `documents` and `document_pages` tables
- Create `search_vector` tsvector column + GIN index + trigger
- Create `search_documents()` database function
- Create storage bucket `documents`
- Enable realtime on `intel_entries`, `documents`, `document_pages`
- RLS policies for all new tables

### Sequencing
1. Database migration (tables, indexes, functions, realtime, storage)
2. Edge functions (ingest-bulk-documents, search-documents)
3. Realtime hook + update all pages
4. Search page overhaul with results, page viewer, upload
