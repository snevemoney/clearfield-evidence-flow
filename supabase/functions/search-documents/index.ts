import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    const { query, limit = 50, has_redactions, source } = await req.json();

    if (!query || query.trim().length === 0) {
      return new Response(JSON.stringify({ results: [], count: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Call the search_documents database function
    const { data: docResults, error: docError } = await supabase.rpc("search_documents", {
      search_query: query,
      result_limit: limit,
    });

    if (docError) {
      console.error("Search function error:", docError);
      throw new Error(docError.message);
    }

    let results = docResults || [];

    // Apply filters
    if (has_redactions === true) {
      results = results.filter((r: any) => r.has_redactions);
    }
    if (source) {
      results = results.filter((r: any) => r.document_source?.toLowerCase().includes(source.toLowerCase()));
    }

    // Also search intel_entries by title/description
    const { data: intelResults } = await supabase
      .from("intel_entries")
      .select("*")
      .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
      .limit(limit);

    return new Response(JSON.stringify({
      document_results: results,
      intel_results: intelResults || [],
      document_count: results.length,
      intel_count: (intelResults || []).length,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("search-documents error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
