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

    let topic = "Jeffrey Epstein";
    let mode = "recent";
    try {
      const body = await req.json();
      if (typeof body?.topic === "string" && body.topic.trim()) topic = body.topic.trim();
      if (typeof body?.mode === "string" && body.mode.trim()) mode = body.mode.trim();
    } catch (e) {
      console.error("ingest-news: invalid JSON body", e);
    }

    const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");
    if (!PERPLEXITY_API_KEY) throw new Error("PERPLEXITY_API_KEY is not configured");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Log the ingestion run
    const { data: run } = await supabase.from("ingestion_runs").insert({
      source_type: "news",
      query: topic,
      status: "running",
    }).select().single();

    // Search with Perplexity
    const searchBody: any = {
      model: "sonar",
      messages: [
        { role: "system", content: "You are a research assistant. Provide comprehensive, factual information with specific names, dates, locations, and source references. Be thorough and cite sources." },
        { role: "user", content: `Provide detailed factual information about: ${topic}. Include key people involved, important dates, locations, organizations, and documented connections. Focus on publicly verified information from court documents, news investigations, and official records.` },
      ],
    };

    if (mode === "recent") {
      searchBody.search_recency_filter = "week";
    }

    const perplexityRes = await fetchWithRetry("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PERPLEXITY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(searchBody),
    });

    if (!perplexityRes.ok) {
      const errText = await perplexityRes.text();
      throw new Error(`Perplexity API error [${perplexityRes.status}]: ${errText}`);
    }

    const perplexityData = await perplexityRes.json();
    const rawContent = perplexityData.choices?.[0]?.message?.content || "";
    const citations = perplexityData.citations || [];

    // Use Lovable AI to structure the raw content into intel entries
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
            content: `You are an intelligence analyst. Extract structured intelligence entries from raw research text. Each entry should be a distinct person, event, institution, document, location, or claim. Use the extract_intel tool to return your results.

RULES:
- Extract as many distinct entries as possible (aim for 5-20)
- Each entry must have accurate categorization
- Include geographic coordinates when locations are mentioned
- Tag entries with relevant topics (e.g. "epstein", "trafficking", "financial")
- List related entity names for graph linking
- Assess credibility: verified (court docs, official records), disputed (conflicting reports), unverified (single source), debunked (proven false)
- Write concise AI summaries
- Always use "allegedly" when describing unproven claims about individuals`,
          },
          {
            role: "user",
            content: `Extract structured intelligence entries from this research:\n\n${rawContent}\n\nSources: ${citations.join(", ")}`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_intel",
              description: "Extract structured intelligence entries from research text",
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
                        fact_check_notes: { type: "string" },
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

    if (!structureRes.ok) {
      if (structureRes.status === 429) throw new Error("AI rate limit exceeded");
      if (structureRes.status === 402) throw new Error("AI credits exhausted");
      throw new Error(`AI gateway error [${structureRes.status}]`);
    }

    const structureData = await structureRes.json();
    const toolCall = structureData.choices?.[0]?.message?.tool_calls?.[0];
    let entries: any[] = [];

    if (toolCall?.function?.arguments) {
      const parsed = JSON.parse(toolCall.function.arguments);
      entries = parsed.entries || [];
    }

    const rows = (entries as any[]).filter((entry) => entry?.title).map((entry) => ({
      title: entry.title,
      description: entry.description,
      category: entry.category,
      lat: entry.lat || null,
      lng: entry.lng || null,
      source_url: entry.source_url || citations[0] || null,
      source_type: "news",
      credibility_score: entry.credibility_score || 50,
      fact_check_status: entry.fact_check_status || "unverified",
      fact_check_notes: entry.fact_check_notes || null,
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

    // Update ingestion run
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
    console.error("ingest-news error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
