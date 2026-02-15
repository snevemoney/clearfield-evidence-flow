
# Build the Complementary Engine: Evidence Hardening + Debate Control + Bridge Import

## Positioning

CLEARFIELD becomes the **post-discovery layer** -- where findings from exploration tools get hardened into neutral, searchable, permanent evidence objects with structured debate and mandatory uncertainty tracking. Not a competitor to discovery tools, but the place where discoveries become durable.

## What Gets Built

### 1. Bridge Import Flow (New Page: `/import`)
A "paste any URL" interface where users drop links and CLEARFIELD does the rest:
- Input: single URL or bulk paste (up to 20 URLs at once -- "clipboard ingest")
- Edge function (`bridge-import`) processes each URL:
  - Extracts metadata + text/transcript via Perplexity
  - Creates an Evidence Object in the `evidence` table
  - Creates a candidate `intel_entry` with `fact_check_status: "unverified"`
  - Suggests Timeline placement (as "candidate" event, not fact)
  - Auto-generates "Open Questions" + "Missing docs" into the Unknowns system
- Results shown inline: what was created, what questions were raised, what's missing
- Each imported item links back to its source URL

### 2. Contradiction Engine (New Page: `/contradictions`)
Side-by-side citation comparison:
- Edge function (`find-contradictions`) scans `intel_entries` for pairs where Source A says X and Source B says Y on the same topic
- UI shows two-column "versus" cards: left source vs right source, with cited text excerpts
- No conclusion drawn -- just the contradiction surfaced with citations
- Users can flag contradictions from any intel entry detail view
- Contradictions are stored in a new `contradictions` table (source_a_id, source_b_id, topic, summary_a, summary_b)

### 3. Claim Protocol Enhancement (Overhaul `/claims`)
Transform the empty Claims page into a structured claim filing system:
- Claims get explicit labels: `alleged`, `unsupported`, `disputed`, `verified`, `retracted`
- Each claim must link to evidence objects or be marked "UNSUPPORTED"
- Claims show linked evidence count and contradiction count
- New claim form: title, content, label selector, evidence linker
- Claims pull from existing `claims` table (already has `label`, `status`, `content` fields)

### 4. Evidence Archive Enhancement (Overhaul `/evidence`)
Transform the empty Evidence page into the evidence object browser:
- Evidence objects are neutral metadata containers (title, source_type, author, excerpt, credibility, URL)
- List view with filters by source type, credibility rating, date
- Each evidence object shows which claims reference it and which contradictions involve it
- Submit evidence form with structured fields
- Uses existing `evidence` table

### 5. Unknowns Generator (Overhaul `/unknowns`)
Transform the static placeholder into a live, auto-populated uncertainty tracker:
- New `unknowns` table: category (known_fact / disputed_claim / unknown / missing_document / redaction / open_question), title, description, source_intel_id, generated_by (user / ai / bridge_import)
- Bridge Import auto-populates "Missing Documents" and "Open Questions"
- Contradiction Engine auto-populates "Disputed Claims"
- Each unknown links back to the intel entry or import that generated it
- Users can add manual unknowns
- Categories match the existing UI sections: KNOWN FACTS, DISPUTED CLAIMS, UNKNOWNS, MISSING DOCUMENTS, REDACTIONS, OPEN QUESTIONS

### 6. Context Notes Enhancement (Overhaul `/notes`)
Transform the empty Context Notes page:
- Notes must cite an evidence object (required `evidence_id` -- already in the `context_notes` table)
- Notes are rated on usefulness (existing `usefulness_score` field)
- Notes attach to any target (claim, evidence, intel entry) via `target_type` + `target_id`
- List view with sort by usefulness score
- Minority views persist -- no deletion, only scoring

### 7. Citation Export
- Button on Evidence and Claims pages: "EXPORT CITATIONS"
- Generates formatted citations (APA/MLA/Chicago) from evidence objects
- Also generates a "Case Brief" summary as downloadable text
- Client-side formatting -- no edge function needed

## Technical Details

### New Database Tables

**`contradictions`**
- id (uuid, PK)
- source_a_id (uuid, FK to intel_entries)
- source_b_id (uuid, FK to intel_entries)
- topic (text)
- summary_a (text) -- what source A claims
- summary_b (text) -- what source B claims
- detected_by (text) -- 'ai' or 'user'
- created_at (timestamptz)

**`unknowns`**
- id (uuid, PK)
- category (text) -- known_fact, disputed_claim, unknown, missing_document, redaction, open_question
- title (text)
- description (text)
- source_intel_id (uuid, FK to intel_entries, nullable)
- generated_by (text) -- 'user', 'ai', 'bridge_import'
- created_at (timestamptz)

Enable realtime on both new tables.

### New Edge Functions

**`bridge-import`**
- Accepts `{ urls: string[] }`
- For each URL, calls Perplexity to extract content/metadata
- Uses Lovable AI to structure into evidence object + intel entry + candidate timeline event + open questions
- Inserts into `evidence`, `intel_entries`, `unknowns` tables
- Returns structured results

**`find-contradictions`**
- Accepts `{ topic?: string }` or empty for full scan
- Queries `intel_entries` grouped by tags/related_entities
- Uses Lovable AI to identify contradicting pairs
- Inserts into `contradictions` table
- Returns found contradictions

### New Files
- `src/pages/BridgeImport.tsx` -- URL paste + bulk import UI
- `src/pages/Contradictions.tsx` -- side-by-side contradiction viewer
- `src/components/claims/ClaimForm.tsx` -- structured claim submission
- `src/components/claims/ClaimCard.tsx` -- claim display with evidence links
- `src/components/evidence/EvidenceForm.tsx` -- evidence submission
- `src/components/evidence/EvidenceCard.tsx` -- evidence display
- `src/components/unknowns/UnknownCard.tsx` -- unknown entry display
- `src/components/notes/NoteForm.tsx` -- context note submission with citation requirement
- `src/components/export/CitationExport.tsx` -- citation formatter
- `supabase/functions/bridge-import/index.ts`
- `supabase/functions/find-contradictions/index.ts`

### Modified Files
- `src/App.tsx` -- add routes for `/import` and `/contradictions`
- `src/components/layout/AppSidebar.tsx` -- add BRIDGE IMPORT and CONTRADICTIONS nav items
- `src/pages/Claims.tsx` -- complete overhaul with claim listing + form
- `src/pages/Evidence.tsx` -- complete overhaul with evidence listing + form
- `src/pages/Unknowns.tsx` -- complete overhaul with live data from `unknowns` table
- `src/pages/ContextNotes.tsx` -- complete overhaul with note listing + form

### Implementation Sequence
1. Database migration (new tables + realtime + RLS)
2. Edge functions (bridge-import, find-contradictions)
3. Claims page overhaul
4. Evidence page overhaul
5. Bridge Import page
6. Contradictions page
7. Unknowns page overhaul
8. Context Notes page overhaul
9. Citation export component
10. Sidebar + routing updates

### No New Dependencies
Uses existing: `@tanstack/react-query`, `@supabase/supabase-js`, `lucide-react`, `framer-motion`, `@radix-ui/react-dialog`
