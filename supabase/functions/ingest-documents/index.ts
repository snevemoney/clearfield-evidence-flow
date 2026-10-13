import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/http.ts";
import { requireCaller, serviceClient } from "../_shared/auth.ts";
import { fetchWithRetry } from "../_shared/retry.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = serviceClient();

  try {
    const auth = await requireCaller(req, supabase, { allowCron: true });
    if (!auth.ok) return auth.response;

    let topic = "Jeffrey Epstein court documents";
    try {
      const body = await req.json();
      if (typeof body?.topic === "string" && body.topic.trim()) topic = body.topic.trim();
    } catch (e) {
      console.error("ingest-documents: invalid JSON body", e);
    }

    const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");
    if (!PERPLEXITY_API_KEY) throw new Error("PERPLEXITY_API_KEY is not configured");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const { data: run } = await supabase.from("ingestion_runs").insert({
      source_type: "documents",
      query: topic,
      status: "running",
    }).select().single();

    // Use Perplexity with academic search for documents
    const perplexityRes = await fetchWithRetry("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PERPLEXITY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "sonar-pro",
        messages: [
          { role: "system", content: "You are a legal and investigative research assistant. Focus on court filings, declassified documents, FOIA releases, and investigative journalism. Provide specific document names, case numbers, dates, and findings." },
          { role: "user", content: `Find court documents, legal filings, declassified documents, and investigative reports about: ${topic}. Include case numbers, filing dates, key findings, and named individuals.` },
        ],
      }),
    });

    if (!perplexityRes.ok) throw new Error(`Perplexity API error [${perplexityRes.status}]`);

    const perplexityData = await perplexityRes.json();
    const rawContent = perplexityData.choices?.[0]?.message?.content || "";
    const citations = perplexityData.citations || [];

    const structureRes = await fetchWithRetry("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `Extract intelligence from legal documents and investigative reports. Court documents and official records have higher credibility (60-90). Use extract_intel tool. Always use "allegedly" for unproven claims.`,
          },
          { role: "user", content: `Extract from documents/reports:\n\n${rawContent}\n\nSources: ${citations.join(", ")}` },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_intel",
              description: "Extract structured intelligence entries",
              parameters: {
                type: "object",
                properties: {
                  entries: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        description: { type: "string" },
                        category: { type: "string", enum: ["person", "event", "institution", "document", "location", "claim"] },
                        lat: { type: "number" },
                        lng: { type: "number" },
                        source_url: { type: "string" },
                        credibility_score: { type: "number" },
                        fact_check_status: { type: "string", enum: ["verified", "disputed", "unverified", "debunked"] },
                        tags: { type: "array", items: { type: "string" } },
                        related_entities: { type: "array", items: { type: "string" } },
                        ai_summary: { type: "string" },
                        published_at: { type: "string" },
                      },
                      required: ["title", "description", "category", "tags", "related_entities", "ai_summary", "credibility_score", "fact_check_status"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["entries"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "extract_intel" } },
      }),
    });

    if (!structureRes.ok) throw new Error(`AI gateway error [${structureRes.status}]`);

    const structureData = await structureRes.json();
    const toolCall = structureData.choices?.[0]?.message?.tool_calls?.[0];
    let entries: any[] = [];

    if (toolCall?.function?.arguments) {
      entries = JSON.parse(toolCall.function.arguments).entries || [];
    }

    const rows = (entries as any[]).filter((entry) => entry?.title).map((entry) => ({
      title: entry.title,
      description: entry.description,
      category: entry.category,
      lat: entry.lat || null,
      lng: entry.lng || null,
      source_url: entry.source_url || citations[0] || null,
      source_type: "court_filing",
      credibility_score: entry.credibility_score || 70,
      fact_check_status: entry.fact_check_status || "verified",
      tags: entry.tags || [],
      related_entities: entry.related_entities || [],
      raw_content: rawContent.substring(0, 5000),
      ai_summary: entry.ai_summary,
      published_at: entry.published_at || null,
    }));
    let addedCount = 0;
    if (rows.length) {
      const { data: inserted, error } = await supabase.from("intel_entries").insert(rows).select("id");
      if (error) console.error("Insert error:", error);
      addedCount = inserted?.length || 0;
    }

    if (run) {
      await supabase.from("ingestion_runs").update({
        entries_found: entries.length,
        entries_added: addedCount,
        status: "completed",
      }).eq("id", run.id);
    }

    return new Response(JSON.stringify({
      success: true,
      entries_found: entries.length,
      entries_added: addedCount,
      run_id: run?.id,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ingest-documents error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
