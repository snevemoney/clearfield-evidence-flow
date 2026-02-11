
-- Core tables for CLEARFIELD platform

-- Profiles table for pseudonymous users
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  handle TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'moderator', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- Topics table
CREATE TABLE public.topics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  depth_score NUMERIC DEFAULT 0,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Topics viewable by all" ON public.topics FOR SELECT USING (true);
CREATE POLICY "Auth users can create topics" ON public.topics FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Creators can update topics" ON public.topics FOR UPDATE USING (auth.uid() = created_by);

-- Claims table with versioning
CREATE TABLE public.claims (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  topic_id UUID REFERENCES public.topics(id),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  label TEXT NOT NULL DEFAULT 'user_claim' CHECK (label IN ('user_claim', 'opinion', 'interpretation')),
  status TEXT NOT NULL DEFAULT 'unsupported' CHECK (status IN ('supported', 'disputed', 'unsupported', 'under_review')),
  version INT NOT NULL DEFAULT 1,
  parent_claim_id UUID REFERENCES public.claims(id),
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.claims ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Claims viewable by all" ON public.claims FOR SELECT USING (true);
CREATE POLICY "Auth users can create claims" ON public.claims FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Evidence objects table
CREATE TABLE public.evidence (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  url TEXT,
  source_type TEXT NOT NULL DEFAULT 'news' CHECK (source_type IN ('news', 'court_filing', 'government_doc', 'academic_paper', 'media_transcript', 'dataset', 'historical_record')),
  author TEXT,
  published_date DATE,
  excerpt TEXT,
  credibility TEXT DEFAULT 'secondary' CHECK (credibility IN ('primary', 'secondary', 'original', 'syndicated', 'on_record', 'anonymous')),
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.evidence ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Evidence viewable by all" ON public.evidence FOR SELECT USING (true);
CREATE POLICY "Auth users can submit evidence" ON public.evidence FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Graph nodes table (for visualizations)
CREATE TABLE public.graph_nodes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  node_type TEXT NOT NULL CHECK (node_type IN ('document', 'event', 'law', 'institution', 'media_artifact', 'person', 'claim')),
  label TEXT NOT NULL,
  description TEXT,
  topic_id UUID REFERENCES public.topics(id),
  ref_id UUID,
  x_pos NUMERIC,
  y_pos NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.graph_nodes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Nodes viewable by all" ON public.graph_nodes FOR SELECT USING (true);
CREATE POLICY "Auth users can create nodes" ON public.graph_nodes FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Graph connections table
CREATE TABLE public.graph_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source_node_id UUID NOT NULL REFERENCES public.graph_nodes(id) ON DELETE CASCADE,
  target_node_id UUID NOT NULL REFERENCES public.graph_nodes(id) ON DELETE CASCADE,
  edge_type TEXT NOT NULL CHECK (edge_type IN ('citation', 'contradiction', 'temporal_overlap', 'source_reuse', 'financial')),
  evidence_id UUID REFERENCES public.evidence(id),
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.graph_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Connections viewable by all" ON public.graph_connections FOR SELECT USING (true);
CREATE POLICY "Auth users can create connections" ON public.graph_connections FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Claim-evidence links
CREATE TABLE public.claim_evidence (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  claim_id UUID NOT NULL REFERENCES public.claims(id) ON DELETE CASCADE,
  evidence_id UUID NOT NULL REFERENCES public.evidence(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.claim_evidence ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Links viewable by all" ON public.claim_evidence FOR SELECT USING (true);
CREATE POLICY "Auth users can link" ON public.claim_evidence FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Context notes
CREATE TABLE public.context_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  target_type TEXT NOT NULL CHECK (target_type IN ('claim', 'evidence')),
  target_id UUID NOT NULL,
  content TEXT NOT NULL,
  evidence_id UUID REFERENCES public.evidence(id),
  usefulness_score INT NOT NULL DEFAULT 0,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.context_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Notes viewable by all" ON public.context_notes FOR SELECT USING (true);
CREATE POLICY "Auth users can create notes" ON public.context_notes FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Timeline events
CREATE TABLE public.timeline_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  topic_id UUID REFERENCES public.topics(id),
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  event_type TEXT NOT NULL DEFAULT 'verified' CHECK (event_type IN ('verified', 'disputed', 'unknown', 'redacted')),
  evidence_id UUID REFERENCES public.evidence(id),
  branch TEXT DEFAULT 'main',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.timeline_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Events viewable by all" ON public.timeline_events FOR SELECT USING (true);
CREATE POLICY "Auth users can create events" ON public.timeline_events FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_topics_updated_at BEFORE UPDATE ON public.topics FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
