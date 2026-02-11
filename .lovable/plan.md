

# Live Intelligence Feed: AI-Powered Data Ingestion System

## Overview
Transform CLEARFIELD from a static demo-data app into a live intelligence platform that actively discovers, ingests, and fact-checks information from public web sources, news APIs, and social media (Twitter/X). The system will use AI to process raw data into structured entries for the Graph, Globe, Nexus, and Timeline views -- with a focus on Epstein-related content and all connected topics.

## Architecture

The system has three layers:
1. **Data Layer** -- Database tables storing ingested intelligence entries, sources, and fact-check results
2. **Ingestion Layer** -- Edge functions that fetch from news/web/Twitter, process with AI, and store structured data
3. **Display Layer** -- Updated pages that query the database instead of (or in addition to) static demo data

---

## Phase 1: Database Schema

Create tables to store live intelligence data:

- **intel_entries** -- Core intelligence items (nodes for the graph, locations for the globe, etc.)
  - `id`, `title`, `description`, `category` (person, event, institution, document, location, claim)
  - `lat`/`lng` (nullable, for globe-mappable entries)
  - `source_url`, `source_type` (news, twitter, court_filing, government_doc, investigative)
  - `credibility_score` (0-100, AI-assessed)
  - `fact_check_status` (verified, disputed, unverified, debunked)
  - `fact_check_notes` (AI reasoning)
  - `tags` (text array -- e.g. "epstein", "financial", "trafficking")
  - `related_entities` (text array of entity names for graph linking)
  - `raw_content`, `ai_summary`
  - `published_at`, `ingested_at`, `created_at`

- **intel_connections** -- Relationships between entries (graph edges, globe arcs)
  - `id`, `source_entry_id`, `target_entry_id`
  - `connection_type` (financial, legal, social, organizational, temporal)
  - `description`, `evidence_strength` (strong, moderate, weak, speculative)

- **intel_sources** -- Track ingestion sources and their reliability
  - `id`, `name`, `url`, `source_type`, `reliability_rating`, `last_fetched_at`

- **ingestion_runs** -- Log of each ingestion cycle
  - `id`, `source_type`, `query`, `entries_found`, `entries_added`, `status`, `created_at`

RLS: All tables will be publicly readable (SELECT) since this is an open intelligence platform. INSERT/UPDATE restricted to service role (edge functions only).

---

## Phase 2: AI Ingestion Edge Functions

### 2a. `ingest-news` Edge Function
- Accepts a `topic` parameter (default: "Jeffrey Epstein")
- Uses Perplexity API (via connector) with `sonar` model to search for recent news
  - Searches with `search_recency_filter: 'week'` for ongoing updates
  - Also runs historical deep searches for comprehensive data
- AI processes each result into structured `intel_entries` format
- Runs fact-check assessment against known data
- Stores in database

### 2b. `ingest-twitter` Edge Function
- Uses Perplexity search with `site:x.com` domain filter to find relevant Twitter/X posts
- Focuses on community discussions, breaking news, document drops
- AI extracts claims, entities, and locations from tweets
- Applies higher scrutiny scoring (social media = lower base credibility)
- Cross-references claims against news sources for fact-checking

### 2c. `ingest-documents` Edge Function
- Targets specific document repositories:
  - Court filings (PACER references)
  - Declassified documents
  - FOIA releases
  - Investigative journalism (e.g., Miami Herald Epstein series)
- Uses Perplexity with `search_mode: 'academic'` for scholarly sources
- Extracts entities, dates, locations, and connections

### 2d. `process-intelligence` Edge Function
- Takes raw ingested entries and:
  - Generates graph connections between related entities
  - Extracts geographic coordinates for globe mapping
  - Assigns Nexus topic universe categorization
  - Creates timeline events from dated entries
  - Cross-references with existing data to find new connections
- Uses Lovable AI (gemini-3-flash-preview) for structured extraction

### 2e. `fact-check` Edge Function
- Takes an intel entry and:
  - Searches for corroborating sources via Perplexity
  - Checks for contradicting information
  - Assesses source reliability
  - Generates a credibility score and fact-check notes
  - Updates the entry's `fact_check_status`

---

## Phase 3: Dashboard and Trigger UI

### 3a. New "Intelligence Hub" Page (`/intelligence`)
- Control panel for data ingestion
- Shows ingestion run history and stats
- Buttons to trigger ingestion for different topics:
  - "INGEST EPSTEIN NEWS" -- runs news + twitter search
  - "DEEP SEARCH: [custom topic]" -- runs comprehensive search on any topic
  - "REFRESH ALL" -- runs all ingestion pipelines
- Shows live count of entries by category, credibility, and source type
- Feed of recently ingested items with fact-check status badges

### 3b. Updated Index Page
- Live Feed now pulls from `intel_entries` ordered by `ingested_at`
- "What We Don't Know" panel shows counts from database
- Stats cards show real counts

### 3c. Updated Graph Page
- Merges database entries (type=person/institution/event) with demo data
- New connections from `intel_connections` table rendered as edges
- Filter by credibility score, source type, tags

### 3d. Updated Globe Page
- Entries with lat/lng rendered as additional markers
- Heatmap density from ingested data overlaid
- New arc network "EPSTEIN" for Epstein-related connections

### 3e. Updated Nexus Page
- New topic universe: "Epstein Network" auto-generated from database entries tagged "epstein"
- Dynamic rings populated from database rather than hardcoded

### 3f. Updated Timeline Page
- Ingested entries with dates added to timeline
- Color-coded by fact-check status

---

## Phase 4: Epstein-Specific Seed Data

Initial ingestion queries to run:
- "Jeffrey Epstein associates flight logs Lolita Express"
- "Ghislaine Maxwell trial documents evidence"
- "Epstein island Little St James visitors"
- "Jeffrey Epstein financial connections banks"
- "Epstein case court filings SDNY"
- "Jeffrey Epstein intelligence connections"
- "Epstein victim testimony public records"
- "JP Morgan Epstein Deutsche Bank lawsuits"
- "Epstein black book contacts"
- "Jeffrey Epstein death investigation findings"

These will seed the database with hundreds of structured entries across all views.

---

## Technical Details

- **Perplexity connector** needed for web search/news ingestion (will prompt to connect)
- **Lovable AI** (gemini-3-flash-preview) used for structuring/fact-checking (already available)
- All ingestion runs through edge functions with service role DB access
- Frontend queries use standard Supabase client with public read access
- Ingestion is user-triggered (not automated/scheduled) to control API usage
- Each ingestion run is logged for transparency
- All data clearly labeled with source attribution and credibility scores

## Sequencing
1. Create database tables (migration)
2. Connect Perplexity connector
3. Build edge functions (ingest-news, ingest-twitter, ingest-documents, process-intelligence, fact-check)
4. Build Intelligence Hub page with trigger UI
5. Update existing pages to merge live data with demo data
6. Run initial Epstein data seed ingestion

