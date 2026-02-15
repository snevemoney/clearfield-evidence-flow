
-- Create contradictions table
CREATE TABLE public.contradictions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source_a_id UUID REFERENCES public.intel_entries(id),
  source_b_id UUID REFERENCES public.intel_entries(id),
  topic TEXT NOT NULL,
  summary_a TEXT NOT NULL,
  summary_b TEXT NOT NULL,
  detected_by TEXT NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.contradictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Contradictions viewable by all" ON public.contradictions FOR SELECT USING (true);
CREATE POLICY "Auth users can create contradictions" ON public.contradictions FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Create unknowns table
CREATE TABLE public.unknowns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL DEFAULT 'unknown',
  title TEXT NOT NULL,
  description TEXT,
  source_intel_id UUID REFERENCES public.intel_entries(id),
  generated_by TEXT NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.unknowns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Unknowns viewable by all" ON public.unknowns FOR SELECT USING (true);
CREATE POLICY "Auth users can create unknowns" ON public.unknowns FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Enable realtime on both new tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.contradictions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.unknowns;
