-- Indexes for FK and commonly filtered/ordered columns (hardening-20 check 18).

CREATE INDEX IF NOT EXISTS idx_claims_topic_id ON public.claims(topic_id);
CREATE INDEX IF NOT EXISTS idx_claims_parent_claim_id ON public.claims(parent_claim_id);
CREATE INDEX IF NOT EXISTS idx_claims_status ON public.claims(status);
CREATE INDEX IF NOT EXISTS idx_claims_created_at ON public.claims(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_evidence_created_at ON public.evidence(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_graph_nodes_topic_id ON public.graph_nodes(topic_id);
CREATE INDEX IF NOT EXISTS idx_graph_connections_source ON public.graph_connections(source_node_id);
CREATE INDEX IF NOT EXISTS idx_graph_connections_target ON public.graph_connections(target_node_id);
CREATE INDEX IF NOT EXISTS idx_graph_connections_evidence ON public.graph_connections(evidence_id);

CREATE INDEX IF NOT EXISTS idx_claim_evidence_claim_id ON public.claim_evidence(claim_id);
CREATE INDEX IF NOT EXISTS idx_claim_evidence_evidence_id ON public.claim_evidence(evidence_id);

CREATE INDEX IF NOT EXISTS idx_context_notes_evidence_id ON public.context_notes(evidence_id);
CREATE INDEX IF NOT EXISTS idx_context_notes_target_id ON public.context_notes(target_id);

CREATE INDEX IF NOT EXISTS idx_timeline_events_topic_id ON public.timeline_events(topic_id);
CREATE INDEX IF NOT EXISTS idx_timeline_events_evidence_id ON public.timeline_events(evidence_id);
CREATE INDEX IF NOT EXISTS idx_timeline_events_event_date ON public.timeline_events(event_date);

CREATE INDEX IF NOT EXISTS idx_contradictions_source_a ON public.contradictions(source_a_id);
CREATE INDEX IF NOT EXISTS idx_contradictions_source_b ON public.contradictions(source_b_id);
CREATE INDEX IF NOT EXISTS idx_contradictions_created_at ON public.contradictions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_unknowns_source_intel_id ON public.unknowns(source_intel_id);
CREATE INDEX IF NOT EXISTS idx_unknowns_category ON public.unknowns(category);

CREATE INDEX IF NOT EXISTS idx_intel_entries_created_at ON public.intel_entries(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ingestion_runs_status ON public.ingestion_runs(status);
CREATE INDEX IF NOT EXISTS idx_ingestion_runs_source_type ON public.ingestion_runs(source_type);
CREATE INDEX IF NOT EXISTS idx_ingestion_runs_created_at ON public.ingestion_runs(created_at DESC);
