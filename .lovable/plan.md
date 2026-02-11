

# CLEARFIELD — Open Civic Intelligence & Evidence Platform

## Vision
A dark, intelligence-program-styled web app where users submit claims, link evidence, and the platform structures truth through neutral AI — never accusing, always organizing. Think: classified intelligence terminal meets open-source investigation.

---

## Design & Aesthetic
- **Dark theme** with deep navy/charcoal backgrounds
- **Accent colors**: Electric cyan, amber warnings, muted green for verified data
- **Typography**: Monospace headers (JetBrains Mono / Fira Code feel), clean sans-serif body text
- **UI patterns**: Glowing borders, subtle scan-line effects, data-dense card layouts, terminal-inspired status indicators
- **Feel**: Like accessing a declassified intelligence dashboard — serious, dense, powerful

---

## Phase 1: Core Platform (This Build)

### 1. Landing / Dashboard
- Dark intelligence-styled homepage with mission statement
- Live feed of recent claims, evidence, and community activity
- Global stats: total claims, evidence objects, open questions
- "What We Don't Know" panel prominently displayed

### 2. Authentication System
- Full auth with Lovable Cloud (email + password)
- Pseudonymous display names (handles, not real names)
- User profiles showing contribution history
- Role system: User, Moderator, Admin

### 3. Claim Objects System
- Create, view, and version claims
- Each claim labeled as "User Claim / Opinion / Interpretation"
- Link evidence to claims (required or marked "unsupported")
- Immutable versioning — edits create new versions, history preserved
- Status indicators: Supported, Disputed, Unsupported, Under Review

### 4. Evidence Objects System
- Submit evidence: paste URL or upload documents
- AI-assisted extraction (via Lovable AI): auto-extract title, author, date, source type, excerpts
- Evidence types: News, Court Filing, Government Doc, Academic Paper, Media Transcript, Dataset, Historical Record
- Source credibility labels: Primary/Secondary, Original/Syndicated, On-record/Anonymous
- Metadata-only storage — no AI conclusions

### 5. Evidence Graph (Visual)
- Interactive node-based graph using React
- Nodes: Documents, Events, Laws, Institutions, Media Artifacts
- Edges: Citation, Contradiction, Temporal Overlap, Source Reuse
- Click any node to expand details and linked claims
- Filter by type, date range, topic

### 6. Timeline Engine
- Visual timeline per topic/claim cluster
- Event types: Verified (sourced), Disputed (conflicting sources), Unknown (gaps)
- Visual gap indicators showing where speculation begins
- Redacted/missing period markers
- Zoomable and filterable by date range

### 7. Community Context Notes
- X-style community notes on any claim or evidence
- Notes must cite evidence to be posted
- Rated on "usefulness" (not agree/disagree)
- Minority views persist — no majority-rules deletion
- Brigading detection flagging

### 8. "What We Don't Know" Panel
- Mandatory on every topic page
- Sections: Known Facts, Disputed Claims, Unknowns, Missing Documents, Redactions, Open Questions
- Auto-populated by AI analysis of evidence gaps
- Community can suggest additions

### 9. AI Intelligence Layer
- Powered by Lovable AI (Gemini)
- Groups related evidence automatically
- Detects contradictions between sources
- Compares timelines across claims
- Highlights missing information
- Summarizes debates without conclusions — shows strongest arguments on all sides
- Strict guardrails: never profiles, accuses, ranks, or predicts

### 10. Media & Transcript Analyzer
- Paste video/article URLs
- AI highlights: inconsistencies, language shifts, hedging vs. certainty, omitted context, framing techniques
- No interpretation of intent — observations only

### 11. Search & Discovery
- Full-text search across claims, evidence, and notes
- Filter by topic, date, evidence type, claim status
- Trending topics and most-discussed claims

---

## Phase 2: Future Features (Not in this build)
- Interactive globe map with historical layers, heatmaps, and event locations
- Uncertainty & probability forecasting views
- Advanced brigading detection algorithms
- API for third-party researchers

---

## Technical Architecture
- **Frontend**: React + Tailwind + TypeScript (dark theme)
- **Backend**: Lovable Cloud (Supabase) for database, auth, edge functions
- **AI**: Lovable AI gateway for evidence extraction, contradiction detection, summarization
- **Graph Visualization**: React-based interactive graph library
- **Database**: Claims, Evidence, Context Notes, Users, Roles, Topics, Timelines

