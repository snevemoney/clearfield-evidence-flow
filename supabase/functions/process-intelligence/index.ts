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

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Latest entries (connection filter is applied after fetch via existingConns)
    const { data: entries, error: fetchErr } = await supabase
      .from("intel_entries")
      .select("id, title, description, category, related_entities, tags, lat, lng")
      .order("created_at", { ascending: false })
      .limit(100);

    if (fetchErr) throw fetchErr;
    if (!entries || entries.length === 0) {
      return new Response(JSON.stringify({ message: "No entries to process" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get existing connections to avoid duplicates
    const { data: existingConns } = await supabase
      .from("intel_connections")
      .select("source_entry_id, target_entry_id")
      .limit(2000);

    const connSet = new Set(
      (existingConns || []).map(c => `${c.source_entry_id}-${c.target_entry_id}`)
    );

    // Use AI to find connections between entries based on related_entities overlap
    const entryList = entries.map(e => ({
      id: e.id,
      title: e.title,
      category: e.category,
      related_entities: e.related_entities,
      tags: e.tags,
    }));

    const aiRes = await fetchWithRetry("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
            content: `Analyze intelligence entries and identify connections between them. Look for shared entities, organizations, events, locations, or financial ties. Use the find_connections tool. Connection types: financial, legal, social, organizational, temporal. Evidence strength: strong (documented proof), moderate (multiple indicators), weak (single link), speculative (circumstantial only).`,
          },
          {
            role: "user",
            content: `Find connections between these intelligence entries:\n\n${JSON.stringify(entryList, null, 2)}`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "find_connections",
              description: "Identify connections between intel entries",
              parameters: {
                type: "object",
                properties: {
                  connections: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        source_id: { type: "string" },
                        target_id: { type: "string" },
                        connection_type: { type: "string", enum: ["financial", "legal", "social", "organizational", "temporal"] },
                        description: { type: "string" },
                        evidence_strength: { type: "string", enum: ["strong", "moderate", "weak", "speculative"] },
                      },
                      required: ["source_id", "target_id", "connection_type", "description", "evidence_strength"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["connections"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "find_connections" } },
      }),
    });

    if (!aiRes.ok) throw new Error(`AI gateway error [${aiRes.status}]`);

    const aiData = await aiRes.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    let connections: any[] = [];

    if (toolCall?.function?.arguments) {
      connections = JSON.parse(toolCall.function.arguments).connections || [];
    }

    // Validate and insert connections
    const validIds = new Set(entries.map(e => e.id));
    const rows = [];
    for (const conn of connections) {
      if (!validIds.has(conn.source_id) || !validIds.has(conn.target_id)) continue;
      if (conn.source_id === conn.target_id) continue;
      const key = `${conn.source_id}-${conn.target_id}`;
      if (connSet.has(key)) continue;
      connSet.add(key);
      rows.push({
        source_entry_id: conn.source_id,
        target_entry_id: conn.target_id,
        connection_type: conn.connection_type,
        description: conn.description,
        evidence_strength: conn.evidence_strength,
      });
    }
    let addedConns = 0;
    if (rows.length) {
      const { data: inserted, error } = await supabase.from("intel_connections").insert(rows).select("id");
      if (error) console.error("Insert error:", error);
      addedConns = inserted?.length || 0;
    }

    return new Response(JSON.stringify({
      success: true,
      entries_analyzed: entries.length,
      connections_added: addedConns,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("process-intelligence error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
