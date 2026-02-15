import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const STRUCTURE_TOOL = {
  type: "function" as const,
  function: {
    name: "structure_import",
    description: "Structure imported content into evidence, intel entry, and unknowns",
    parameters: {
      type: "object",
      properties: {
        evidence: {
          type: "object",
          properties: {
            title: { type: "string" },
            source_type: { type: "string", enum: ["news", "court_filing", "government_doc", "academic_paper", "media_transcript", "dataset", "historical_record"] },
            author: { type: "string" },
            excerpt: { type: "string", description: "Key excerpt, max 500 chars" },
            credibility: { type: "string", enum: ["primary", "secondary", "tertiary"] },
            published_date: { type: "string", description: "ISO date or null" },
          },
          required: ["title", "source_type", "excerpt"],
        },
        intel_entry: {
          type: "object",
          properties: {
            title: { type: "string" },
            description: { type: "string" },
            category: { type: "string", enum: ["claim", "evidence", "person", "organization", "event", "document"] },
            tags: { type: "array", items: { type: "string" } },
            related_entities: { type: "array", items: { type: "string" } },
          },
          required: ["title", "description", "category"],
        },
        timeline_event: {
          type: "object",
          properties: {
            title: { type: "string" },
            event_date: { type: "string", description: "ISO date" },
            description: { type: "string" },
          },
          required: ["title"],
        },
        open_questions: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              description: { type: "string" },
              category: { type: "string", enum: ["open_question", "missing_document", "unknown"] },
            },
            required: ["title", "category"],
          },
        },
      },
      required: ["evidence", "intel_entry", "open_questions"],
    },
  },
};

const VALID_SOURCE_TYPES = ["news", "court_filing", "government_doc", "academic_paper", "media_transcript", "dataset", "historical_record"];

async function insertStructured(
  supabase: ReturnType<typeof createClient>,
  structured: any,
  source: { url?: string; source_label?: string; raw_content: string },
) {
  const sourceType = VALID_SOURCE_TYPES.includes(structured.evidence.source_type)
    ? structured.evidence.source_type
    : "media_transcript";

  const { data: evidenceRow, error: evErr } = await supabase.from("evidence").insert({
    title: structured.evidence.title,
    source_type: sourceType,
    author: structured.evidence.author || source.source_label || null,
    excerpt: structured.evidence.excerpt || null,
    credibility: structured.evidence.credibility || "secondary",
    url: source.url || null,
    published_date: structured.evidence.published_date || null,
  }).select("id").single();

  if (evErr) throw new Error(evErr.message);

  const { data: intelRow } = await supabase.from("intel_entries").insert({
    title: structured.intel_entry.title,
    description: structured.intel_entry.description,
    category: structured.intel_entry.category || "evidence",
    source_type: sourceType,
    source_url: source.url || null,
    fact_check_status: "unverified",
    tags: structured.intel_entry.tags || [],
    related_entities: structured.intel_entry.related_entities || [],
    raw_content: source.raw_content.substring(0, 5000),
  }).select("id").single();

  let timelineId = null;
  if (structured.timeline_event?.event_date) {
    const { data: tlRow } = await supabase.from("timeline_events").insert({
      title: structured.timeline_event.title,
      event_date: structured.timeline_event.event_date,
      description: structured.timeline_event.description || null,
      event_type: "candidate",
      evidence_id: evidenceRow.id,
    }).select("id").single();
    timelineId = tlRow?.id;
  }

  const unknownsInserted: string[] = [];
  if (structured.open_questions?.length) {
    for (const q of structured.open_questions) {
      await supabase.from("unknowns").insert({
        category: q.category || "open_question",
        title: q.title,
        description: q.description || null,
        source_intel_id: intelRow?.id || null,
        generated_by: "bridge_import",
      });
      unknownsInserted.push(q.title);
    }
  }

  return {
    evidence_id: evidenceRow.id,
    intel_entry_id: intelRow?.id,
    timeline_event_id: timelineId,
    unknowns_generated: unknownsInserted,
    evidence_title: structured.evidence.title,
  };
}

async function structureWithAI(
  apiKey: string,
  systemPrompt: string,
  userContent: string,
) {
  const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
      tools: [STRUCTURE_TOOL],
      tool_choice: { type: "function", function: { name: "structure_import" } },
    }),
  });

  const aiData = await aiRes.json();
  const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
  if (!toolCall) return null;
  return JSON.parse(toolCall.function.arguments);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const urls: string[] | undefined = body.urls;
    const texts: { content: string; source_label?: string }[] | undefined = body.texts;

    const hasUrls = Array.isArray(urls) && urls.length > 0;
    const hasTexts = Array.isArray(texts) && texts.length > 0;

    if (!hasUrls && !hasTexts) {
      return new Response(JSON.stringify({ error: "Provide urls or texts array" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "Missing AI API key" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results: any[] = [];

    // Process URLs
    if (hasUrls) {
      if (!PERPLEXITY_API_KEY) {
        return new Response(JSON.stringify({ error: "Missing Perplexity API key for URL mode" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      for (const url of urls!.slice(0, 20)) {
        try {
          const perplexityRes = await fetch("https://api.perplexity.ai/chat/completions", {
            method: "POST",
            headers: { Authorization: `Bearer ${PERPLEXITY_API_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              model: "sonar-pro",
              messages: [
                { role: "system", content: "Extract all factual content from the given URL. Include: title, author, publication date, full text excerpt, key entities mentioned, and any dates/events referenced. Be thorough and factual." },
                { role: "user", content: `Extract content and metadata from this URL: ${url}` },
              ],
            }),
          });

          const perplexityData = await perplexityRes.json();
          const extractedContent = perplexityData.choices?.[0]?.message?.content || "";

          const structured = await structureWithAI(
            LOVABLE_API_KEY,
            "You are an intelligence analyst structuring extracted web content into evidence objects. Be neutral and factual. Never draw conclusions.",
            `Structure this extracted content into an evidence object.\n\nSource URL: ${url}\n\nExtracted content:\n${extractedContent}`,
          );

          if (!structured) {
            results.push({ url, status: "error", error: "AI failed to structure content" });
            continue;
          }

          const inserted = await insertStructured(supabase, structured, { url, raw_content: extractedContent });
          results.push({ url, status: "success", ...inserted });
        } catch (urlErr) {
          results.push({ url, status: "error", error: urlErr instanceof Error ? urlErr.message : "Unknown error" });
        }
      }
    }

    // Process text entries
    if (hasTexts) {
      for (const entry of texts!.slice(0, 5)) {
        try {
          const content = entry.content.substring(0, 10000);
          const label = entry.source_label || "Text import";

          const structured = await structureWithAI(
            LOVABLE_API_KEY,
            "You are an intelligence analyst structuring a research conversation transcript into evidence objects. The text is a chat transcript between a user and an AI research assistant. Extract factual claims, entities, dates, events, and open questions. Be neutral and factual. Never draw conclusions. If the transcript contains multiple distinct evidence items, focus on the single most significant one.",
            `Structure this chat transcript into an evidence object.\n\nSource: ${label}\n\nTranscript:\n${content}`,
          );

          if (!structured) {
            results.push({ source_label: label, status: "error", error: "AI failed to structure content" });
            continue;
          }

          const inserted = await insertStructured(supabase, structured, {
            source_label: label,
            raw_content: content,
          });
          results.push({ source_label: label, status: "success", ...inserted });
        } catch (textErr) {
          results.push({
            source_label: entry.source_label || "Text import",
            status: "error",
            error: textErr instanceof Error ? textErr.message : "Unknown error",
          });
        }
      }
    }

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
