

# Interactive Visual Features for CLEARFIELD
*Inspired by connection maps, iceberg charts, and radial knowledge webs*

---

## Feature 1: Interactive Connection Web ("The Web")

A zoomable, pannable canvas where every node is an evidence-backed object (document, institution, event, claim) and every edge is a documented relationship.

- **Pan and zoom** like Google Maps across a dense node graph
- **Click any node** to expand its evidence panel (sources, linked claims, context notes)
- **Edge types** are color-coded: Citation (cyan), Contradiction (red/amber), Temporal overlap (green), Financial link (gold)
- **Search highlights** a node and pulses its connections outward
- **Filter toggles**: show/hide by category (Institutions, Events, Documents, People mentioned in claims)
- **Community-contributed nodes**: users submit connections with required evidence links
- Every connection displays its source — no unsourced lines
- Built with a canvas-based graph library (e.g., react-force-graph or custom SVG/Canvas renderer)

**Why users love it**: It's the conspiracy map experience, but every line is clickable and citable.

---

## Feature 2: The Iceberg Explorer ("Depth View")

A vertical interactive iceberg visualization showing topics layered by how well-documented they are.

- **Surface level** (top): Well-sourced, mainstream-acknowledged facts
- **Mid-depth**: Disputed claims with partial evidence
- **Deep**: Speculation, theories with minimal sourcing
- **Abyss**: Open questions with zero evidence either way
- Each layer is **clickable** — expands into the claims and evidence at that depth
- Topics **auto-sort** based on evidence density (AI-calculated from linked sources)
- Users can **submit claims** and the system places them at the appropriate depth
- Visual design: dark ocean gradient, glowing text, parallax scroll effect

**Why users love it**: Gamifies the "how deep does this go" curiosity while honestly showing where evidence runs out.

---

## Feature 3: Radial Topic Explorer ("The Nexus")

A circular/radial visualization where a central topic radiates outward into subtopics, evidence clusters, and related claims — like the Energy Map reference image.

- **Center**: The selected topic (e.g., "Federal Reserve", "DARPA", "Pharmaceutical Industry")
- **Inner ring**: Direct evidence objects (court filings, documents, news articles)
- **Middle ring**: Related claims and user interpretations
- **Outer ring**: Connected topics and institutions
- Click any ring segment to **re-center** the visualization on that node
- **Animated transitions** as you navigate between topics
- Size of segments proportional to evidence density
- Color-coded by evidence type

**Why users love it**: Beautiful, meditative exploration. Like Wikipedia rabbit holes but visual.

---

## Feature 4: Circuit Board Network ("Intel View")

A DARPA-map-inspired dark circuit board aesthetic showing institutional and organizational connections.

- **Dark background** with thin glowing connection lines (very on-brand for CLEARFIELD)
- Nodes styled as circuit components: circles for institutions, squares for events, diamonds for documents
- **Hover** shows a tooltip with quick summary and source count
- **Click** opens a detailed dossier panel (all evidence, claims, context notes for that node)
- **Animated data flow** along edges showing citation direction
- **Filter by era**: toggle time periods to see how connections evolved
- Red accent nodes for contradictions/disputes

**Why users love it**: The "hacker intelligence terminal" aesthetic at its peak. Dense, serious, explorable.

---

## Feature 5: Rabbit Hole Navigator ("Deep Dive")

A guided exploration mode: pick any topic and the system shows you a vertical drill-down path.

- Start with a topic card at the top
- AI generates a structured "rabbit hole" path: 5-10 layers deep
- Each layer shows: what we know, what's disputed, what's unknown
- Users can **fork the path** at any junction (choose which branch to follow)
- **Breadcrumb trail** shows your exploration path
- **Save and share** your rabbit hole paths with other users
- Every layer links back to source evidence
- "You are here" indicator showing depth level

**Why users love it**: Guided exploration with agency. Like a "choose your own investigation."

---

## Feature 6: Living Timeline River

A horizontal flowing timeline with branching narrative streams.

- Main river = the primary documented timeline of events
- **Branches** split off where narratives diverge (different sources tell different stories)
- **Confluences** where branches merge back (when evidence aligns)
- **Gaps** visually shown as dried-up sections (missing evidence periods)
- **Hover over any event** for quick evidence preview
- **Click** to see full evidence panel
- **Scroll horizontally** through time, zoom in/out for detail
- Color intensity shows evidence density (bright = well-sourced, dim = sparse)

**Why users love it**: Shows how narratives form, split, and sometimes reconverge — makes the process of truth-emergence visible.

---

## Implementation Approach

### Phase A (Build First)
1. **Connection Web** — This is the core "Evidence Graph" page already stubbed out, just needs the interactive canvas
2. **Circuit Board view** — An alternative rendering mode for the same graph data, matching CLEARFIELD's aesthetic perfectly

### Phase B (Build Second)
3. **Iceberg Explorer** — New page/component, uses claim + evidence data to auto-sort by depth
4. **Timeline River** — Enhances the existing Timeline page with branching narratives

### Phase C (Build Third)
5. **Radial Topic Explorer** — Advanced visualization, needs good topic clustering
6. **Rabbit Hole Navigator** — AI-powered guided exploration, uses Lovable AI for path generation

### Technical Stack
- **Graph rendering**: Custom SVG/Canvas with d3-force for physics simulation, or react-force-graph-2d for the connection web
- **Iceberg/Radial**: Custom SVG components with Framer Motion animations
- **Timeline**: Custom horizontal scroll component with zoom controls
- **Data layer**: All visualizations pull from the same claims + evidence database tables
- **AI layer**: Lovable AI (Gemini) for auto-categorizing depth levels, generating rabbit hole paths, and clustering related topics

### Database Requirements
- Topics table (for organizing clusters)
- Connections table (node-to-node relationships with evidence links and edge types)
- User exploration paths table (saved rabbit holes)
- Topic depth scores (AI-calculated evidence density)

### Key Principle
Every visual element must link back to evidence. No floating unsourced nodes. If a connection exists on the graph, it has a citation. This is what separates CLEARFIELD from a static conspiracy poster — **every line is clickable and verifiable**.

