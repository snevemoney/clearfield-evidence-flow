
-- Intel entries: core intelligence items
CREATE TABLE public.intel_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'claim',
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  source_url TEXT,
  source_type TEXT NOT NULL DEFAULT 'news',
  credibility_score INTEGER DEFAULT 50,
  fact_check_status TEXT NOT NULL DEFAULT 'unverified',
  fact_check_notes TEXT,
  tags TEXT[] DEFAULT '{}',
  related_entities TEXT[] DEFAULT '{}',
  raw_content TEXT,
  ai_summary TEXT,
  published_at TIMESTAMP WITH TIME ZONE,
  ingested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.intel_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Intel entries readable by all"
  ON public.intel_entries FOR SELECT USING (true);

CREATE POLICY "Service role can insert intel entries"
  ON public.intel_entries FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can update intel entries"
  ON public.intel_entries FOR UPDATE USING (true);

-- Intel connections: relationships between entries
CREATE TABLE public.intel_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source_entry_id UUID NOT NULL REFERENCES public.intel_entries(id) ON DELETE CASCADE,
  target_entry_id UUID NOT NULL REFERENCES public.intel_entries(id) ON DELETE CASCADE,
  connection_type TEXT NOT NULL DEFAULT 'social',
  description TEXT,
  evidence_strength TEXT NOT NULL DEFAULT 'moderate',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.intel_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Intel connections readable by all"
  ON public.intel_connections FOR SELECT USING (true);

CREATE POLICY "Service role can insert intel connections"
  ON public.intel_connections FOR INSERT WITH CHECK (true);

-- Intel sources: track ingestion sources
CREATE TABLE public.intel_sources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT,
  source_type TEXT NOT NULL DEFAULT 'news',
  reliability_rating INTEGER DEFAULT 50,
  last_fetched_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.intel_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Intel sources readable by all"
  ON public.intel_sources FOR SELECT USING (true);

CREATE POLICY "Service role can insert intel sources"
  ON public.intel_sources FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role can update intel sources"
  ON public.intel_sources FOR UPDATE USING (true);

-- Ingestion runs: log of each ingestion cycle
CREATE TABLE public.ingestion_runs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source_type TEXT NOT NULL DEFAULT 'news',
  query TEXT NOT NULL,
  entries_found INTEGER DEFAULT 0,
  entries_added INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'running',
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.ingestion_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ingestion runs readable by all"
  ON public.ingestion_runs FOR SELECT USING (true);

CREATE POLICY "Service role can insert ingestion runs"
  ON public.ingestion_runs FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role can update ingestion runs"
  ON public.ingestion_runs FOR UPDATE USING (true);

-- Indexes for performance
CREATE INDEX idx_intel_entries_tags ON public.intel_entries USING GIN(tags);
CREATE INDEX idx_intel_entries_category ON public.intel_entries(category);
CREATE INDEX idx_intel_entries_fact_check ON public.intel_entries(fact_check_status);
CREATE INDEX idx_intel_entries_ingested ON public.intel_entries(ingested_at DESC);
CREATE INDEX idx_intel_entries_latlng ON public.intel_entries(lat, lng) WHERE lat IS NOT NULL;
CREATE INDEX idx_intel_connections_source ON public.intel_connections(source_entry_id);
CREATE INDEX idx_intel_connections_target ON public.intel_connections(target_entry_id);
