DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'evidence') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.evidence;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'timeline_events') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.timeline_events;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'contradictions') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.contradictions;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'claims') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.claims;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'claim_evidence') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.claim_evidence;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'context_notes') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.context_notes;
  END IF;
END $$;