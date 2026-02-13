
-- Create documents table
CREATE TABLE public.documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  source TEXT,
  file_url TEXT,
  total_pages INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Documents readable by all" ON public.documents FOR SELECT USING (true);
CREATE POLICY "Service role can insert documents" ON public.documents FOR INSERT WITH CHECK (true);
CREATE POLICY "Service role can update documents" ON public.documents FOR UPDATE USING (true);

-- Create document_pages table
CREATE TABLE public.document_pages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  page_number INTEGER NOT NULL,
  extracted_text TEXT DEFAULT '',
  has_redactions BOOLEAN DEFAULT false,
  redaction_count INTEGER DEFAULT 0,
  page_image_url TEXT,
  search_vector TSVECTOR,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.document_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Document pages readable by all" ON public.document_pages FOR SELECT USING (true);
CREATE POLICY "Service role can insert document pages" ON public.document_pages FOR INSERT WITH CHECK (true);
CREATE POLICY "Service role can update document pages" ON public.document_pages FOR UPDATE USING (true);

-- GIN index for full-text search
CREATE INDEX idx_document_pages_search ON public.document_pages USING GIN(search_vector);
CREATE INDEX idx_document_pages_document_id ON public.document_pages(document_id);

-- Trigger to auto-populate search_vector
CREATE OR REPLACE FUNCTION public.update_document_page_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := to_tsvector('english', COALESCE(NEW.extracted_text, ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_update_search_vector
BEFORE INSERT OR UPDATE OF extracted_text ON public.document_pages
FOR EACH ROW
EXECUTE FUNCTION public.update_document_page_search_vector();

-- Full-text search function
CREATE OR REPLACE FUNCTION public.search_documents(search_query TEXT, result_limit INTEGER DEFAULT 50)
RETURNS TABLE (
  page_id UUID,
  document_id UUID,
  page_number INTEGER,
  extracted_text TEXT,
  has_redactions BOOLEAN,
  redaction_count INTEGER,
  page_image_url TEXT,
  document_title TEXT,
  document_source TEXT,
  rank REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    dp.id AS page_id,
    dp.document_id,
    dp.page_number,
    dp.extracted_text,
    dp.has_redactions,
    dp.redaction_count,
    dp.page_image_url,
    d.title AS document_title,
    d.source AS document_source,
    ts_rank(dp.search_vector, plainto_tsquery('english', search_query)) AS rank
  FROM public.document_pages dp
  JOIN public.documents d ON d.id = dp.document_id
  WHERE dp.search_vector @@ plainto_tsquery('english', search_query)
  ORDER BY rank DESC
  LIMIT result_limit;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Storage bucket for documents
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', true);

CREATE POLICY "Documents bucket publicly readable" ON storage.objects FOR SELECT USING (bucket_id = 'documents');
CREATE POLICY "Anyone can upload to documents bucket" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'documents');

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.intel_entries;
ALTER PUBLICATION supabase_realtime ADD TABLE public.documents;
ALTER PUBLICATION supabase_realtime ADD TABLE public.document_pages;
