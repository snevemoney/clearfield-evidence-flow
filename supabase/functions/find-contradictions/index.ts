import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, json } from "../_shared/http.ts";
import { requireCaller, serviceClient } from "../_shared/auth.ts";
import { fetchWithRetry } from "../_shared/retry.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = serviceClient();
    const auth = await requireCaller(req, supabase);
    if (!auth.ok) return auth.response;

    let topic: string | undefined;
    try {
      const body = await req.json();
      if (typeof body?.topic === "string" && body.topic.trim()) topic = body.topic.trim();
    } catch (e) {
      console.error("find-contradictions: invalid JSON body", e);
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "Missing LOVABLE_API_KEY" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch intel entries
    let query = supabase.from("intel_entries").select("id, title, description, category, source_type, source_url, tags, related_entities, ai_summary, raw_content, fact_check_status").order("created_at", { ascending: false }).limit(100);

    const { data: entries, error } = await query;
    if (error || !entries || entries.length < 2) {
      return new Response(JSON.stringify({ contradictions: [], message: "Not enough entries to scan" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build summaries for AI
    const entrySummaries = entries.map((e: any) => ({
      id: e.id,
      title: e.title,
      description: e.description || "",
      source: e.source_type,
      status: e.fact_check_status,
      tags: e.tags || [],
      entities: e.related_entities || [],
      content_preview: (e.raw_content || e.ai_summary || e.description || "").substring(0, 300),
    }));

    const aiRes = await fetchWithRetry("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [
          { role: "system", content: "You are an analyst identifying contradictions between intelligence entries. Find pairs where two sources make conflicting claims about the same topic. Be specific about what each source claims. Only identify genuine contradictions, not mere differences in coverage." },
          { role: "user", content: `Analyze these intel entries for contradictions${topic ? ` related to "${topic}"` : ""}:\n\n${JSON.stringify(entrySummaries, null, 2)}` },
        ],
        tools: [{
          type: "function",
          function: {
            name: "report_contradictions",
            description: "Report found contradictions between intel entries",
            parameters: {
              type: "object",
              properties: {
                contradictions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      source_a_id: { type: "string", description: "UUID of first entry" },
                      source_b_id: { type: "string", description: "UUID of second entry" },
                      topic: { type: "string" },
                      summary_a: { type: "string", description: "What source A claims" },
                      summary_b: { type: "string", description: "What source B claims" },
                    },
                    required: ["source_a_id", "source_b_id", "topic", "summary_a", "summary_b"],
                  },
                },
              },
              required: ["contradictions"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "report_contradictions" } },
      }),
    });

    const aiData = await aiRes.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      return new Response(JSON.stringify({ contradictions: [], message: "No contradictions found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { contradictions } = JSON.parse(toolCall.function.arguments);
    const validEntryIds = new Set(entries.map((e: any) => e.id));
    const contradictionRows = (contradictions || []).filter((c: any) =>
      validEntryIds.has(c.source_a_id) && validEntryIds.has(c.source_b_id)
    ).map((c: any) => ({
      source_a_id: c.source_a_id,
      source_b_id: c.source_b_id,
      topic: c.topic,
      summary_a: c.summary_a,
      summary_b: c.summary_b,
      detected_by: "ai",
    }));

    let inserted: any[] = [];
    if (contradictionRows.length) {
      const { data, error: insertErr } = await supabase.from("contradictions").insert(contradictionRows).select();
      if (insertErr) console.error("contradictions insert:", insertErr);
      inserted = data || [];
      if (inserted.length) {
        const unknownRows = inserted.map((c) => ({
          category: "disputed_claim",
          title: `Contradiction: ${c.topic}`,
          description: `Source A claims: ${c.summary_a}\nSource B claims: ${c.summary_b}`,
          generated_by: "ai",
        }));
        const { error: unknownErr } = await supabase.from("unknowns").insert(unknownRows);
        if (unknownErr) console.error("unknowns insert:", unknownErr);
      }
    }

    return json({ success: true, contradictions: inserted });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
