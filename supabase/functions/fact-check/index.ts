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

    let entry_id: string | undefined;
    try {
      const body = await req.json();
      entry_id = typeof body?.entry_id === "string" ? body.entry_id : undefined;
    } catch (e) {
      console.error("fact-check: invalid JSON body", e);
    }

    const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");
    if (!PERPLEXITY_API_KEY) throw new Error("PERPLEXITY_API_KEY is not configured");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // If no entry_id, fact-check unverified entries in batch
    let entriesToCheck: any[] = [];

    if (entry_id) {
      const { data } = await supabase.from("intel_entries")
        .select("*").eq("id", entry_id).single();
      if (data) entriesToCheck = [data];
    } else {
      const { data } = await supabase.from("intel_entries")
        .select("*")
        .eq("fact_check_status", "unverified")
        .order("created_at", { ascending: false })
        .limit(10);
      entriesToCheck = data || [];
    }

    if (entriesToCheck.length === 0) {
      return new Response(JSON.stringify({ message: "No entries to fact-check" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let checkedCount = 0;

    for (const entry of entriesToCheck) {
      // Search for corroborating/contradicting sources
      const searchRes = await fetchWithRetry("https://api.perplexity.ai/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${PERPLEXITY_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "sonar",
          messages: [
            { role: "system", content: "You are a fact-checker. Verify claims by finding corroborating or contradicting evidence. Be objective and thorough." },
            { role: "user", content: `Fact-check this claim: "${entry.title}". Description: ${entry.description}. Find corroborating and contradicting evidence.` },
          ],
        }),
      });

      if (!searchRes.ok) continue;
      const searchData = await searchRes.json();
      const evidence = searchData.choices?.[0]?.message?.content || "";

      // Use AI to assess
      const assessRes = await fetchWithRetry("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
              content: `Assess the credibility of an intelligence entry based on fact-checking evidence. Use the assess_credibility tool.`,
            },
            {
              role: "user",
              content: `Original claim: "${entry.title}" - ${entry.description}\n\nFact-check evidence:\n${evidence}`,
            },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "assess_credibility",
                description: "Assess credibility of an intel entry",
                parameters: {
                  type: "object",
                  properties: {
                    credibility_score: { type: "number" },
                    fact_check_status: { type: "string", enum: ["verified", "disputed", "unverified", "debunked"] },
                    fact_check_notes: { type: "string" },
                  },
                  required: ["credibility_score", "fact_check_status", "fact_check_notes"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: { type: "function", function: { name: "assess_credibility" } },
        }),
      });

      if (!assessRes.ok) continue;
      const assessData = await assessRes.json();
      const tc = assessData.choices?.[0]?.message?.tool_calls?.[0];

      if (tc?.function?.arguments) {
        const assessment = JSON.parse(tc.function.arguments);
        await supabase.from("intel_entries").update({
          credibility_score: assessment.credibility_score,
          fact_check_status: assessment.fact_check_status,
          fact_check_notes: assessment.fact_check_notes,
        }).eq("id", entry.id);
        checkedCount++;
      }
    }

    return new Response(JSON.stringify({
      success: true,
      entries_checked: checkedCount,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("fact-check error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
