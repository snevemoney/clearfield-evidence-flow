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
    description: "Structure imported content into evidence, intel entries, claims, graph entities, connections, timeline events, and unknowns. Extract ALL entities, locations, dates, and relationships.",
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
        intel_entries: {
          type: "array",
          description: "Multiple intel entries — one for the main topic plus one per significant entity/person/org/event mentioned. Each should have location if known.",
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              description: { type: "string" },
              category: { type: "string", enum: ["claim", "evidence", "person", "organization", "event", "document"] },
              tags: { type: "array", items: { type: "string" } },
              related_entities: { type: "array", items: { type: "string" } },
              lat: { type: "number", description: "Latitude of the location associated with this entry. Use the most relevant real-world coordinate." },
              lng: { type: "number", description: "Longitude of the location associated with this entry." },
              fact_check_status: { type: "string", enum: ["verified", "unverified", "disputed"], description: "Based on evidence strength" },
              credibility_score: { type: "number", description: "1-100 score based on evidence quality" },
            },
            required: ["title", "description", "category"],
          },
        },
        claims: {
          type: "array",
          description: "Factual claims extracted from the content. Each claim should be a distinct assertion.",
          items: {
            type: "object",
            properties: {
              title: { type: "string", description: "Short claim title" },
              content: { type: "string", description: "Full claim text" },
              label: { type: "string", enum: ["alleged", "unsupported", "disputed", "verified", "retracted"] },
              status: { type: "string", enum: ["open", "confirmed", "debunked"] },
            },
            required: ["title", "content", "label"],
          },
        },
        connections: {
          type: "array",
          description: "Relationships between entities mentioned in the content. Use indices into the intel_entries array.",
          items: {
            type: "object",
            properties: {
              source_index: { type: "number", description: "Index into intel_entries array" },
              target_index: { type: "number", description: "Index into intel_entries array" },
              connection_type: { type: "string", enum: ["financial", "organizational", "personal", "legal", "temporal", "evidentiary", "contradiction"] },
              evidence_strength: { type: "string", enum: ["strong", "moderate", "weak"] },
              description: { type: "string" },
            },
            required: ["source_index", "target_index", "connection_type", "description"],
          },
        },
        timeline_events: {
          type: "array",
          description: "All datable events mentioned or implied. Always include ISO dates (YYYY-MM-DD or YYYY-MM or YYYY).",
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              event_date: { type: "string", description: "ISO date (YYYY-MM-DD preferred)" },
              description: { type: "string" },
              event_type: { type: "string", enum: ["verified", "disputed", "unknown", "redacted"] },
              branch: { type: "string", enum: ["main", "shadow"], description: "main for well-sourced, shadow for speculative" },
            },
            required: ["title", "event_date"],
          },
        },
        topic: {
          type: "object",
          description: "The overarching topic/subject of this content",
          properties: {
            title: { type: "string" },
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
              category: { type: "string", enum: ["open_question", "missing_document", "unknown", "disputed_claim"] },
            },
            required: ["title", "category"],
          },
        },
      },
      required: ["evidence", "intel_entries", "claims", "connections", "timeline_events", "open_questions"],
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

  // 1. Insert evidence
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

  // 2. Insert topic if provided
  let topicId: string | null = null;
  if (structured.topic?.title) {
    // Check if topic already exists
    const { data: existingTopic } = await supabase
      .from("topics")
      .select("id")
      .ilike("title", structured.topic.title)
      .maybeSingle();

    if (existingTopic) {
      topicId = existingTopic.id;
    } else {
      const { data: topicRow } = await supabase.from("topics").insert({
        title: structured.topic.title,
        description: structured.topic.description || null,
      }).select("id").single();
      topicId = topicRow?.id || null;
    }
  }

  // 3. Insert intel entries (multiple)
  const intelEntries = Array.isArray(structured.intel_entries) ? structured.intel_entries : [structured.intel_entries || structured.intel_entry];
  const intelIds: string[] = [];

  for (const entry of intelEntries) {
    if (!entry?.title) continue;
    const { data: intelRow } = await supabase.from("intel_entries").insert({
      title: entry.title,
      description: entry.description || null,
      category: entry.category || "evidence",
      source_type: sourceType,
      source_url: source.url || null,
      fact_check_status: entry.fact_check_status || "unverified",
      credibility_score: entry.credibility_score || 50,
      tags: entry.tags || [],
      related_entities: entry.related_entities || [],
      lat: entry.lat || null,
      lng: entry.lng || null,
      raw_content: source.raw_content.substring(0, 5000),
    }).select("id").single();
    intelIds.push(intelRow?.id || "");
  }

  // 4. Insert intel connections
  if (structured.connections?.length && intelIds.length > 1) {
    for (const conn of structured.connections) {
      const srcId = intelIds[conn.source_index];
      const tgtId = intelIds[conn.target_index];
      if (srcId && tgtId && srcId !== tgtId) {
        await supabase.from("intel_connections").insert({
          source_entry_id: srcId,
          target_entry_id: tgtId,
          connection_type: conn.connection_type || "evidentiary",
          evidence_strength: conn.evidence_strength || "moderate",
          description: conn.description || null,
        });
      }
    }
  }

  // 5. Insert claims and link to evidence
  const claimsInserted: string[] = [];
  if (structured.claims?.length) {
    for (const claim of structured.claims) {
      if (!claim?.title) continue;
      const { data: claimRow } = await supabase.from("claims").insert({
        title: claim.title,
        content: claim.content || claim.title,
        label: claim.label || "alleged",
        status: claim.status || "open",
        topic_id: topicId,
      }).select("id").single();

      if (claimRow?.id) {
        claimsInserted.push(claim.title);
        // Link claim to evidence
        await supabase.from("claim_evidence").insert({
          claim_id: claimRow.id,
          evidence_id: evidenceRow.id,
        });
      }
    }
  }

  // 6. Insert timeline events
  const timelineIds: string[] = [];
  if (structured.timeline_events?.length) {
    for (const te of structured.timeline_events) {
      if (!te?.title || !te?.event_date) continue;
      const { data: tlRow } = await supabase.from("timeline_events").insert({
        title: te.title,
        event_date: te.event_date,
        description: te.description || null,
        event_type: te.event_type || "unknown",
        branch: te.branch || "main",
        evidence_id: evidenceRow.id,
        topic_id: topicId,
      }).select("id").single();
      if (tlRow?.id) timelineIds.push(tlRow.id);
    }
  }

  // 7. Insert graph nodes + connections
  const graphNodeIds: string[] = [];
  if (intelIds.length > 0) {
    for (let i = 0; i < intelEntries.length; i++) {
      const entry = intelEntries[i];
      if (!entry?.title) continue;
      const nodeType = entry.category === "person" ? "person"
        : entry.category === "organization" ? "institution"
        : entry.category === "event" ? "event"
        : entry.category === "claim" ? "claim"
        : "document";

      const { data: nodeRow } = await supabase.from("graph_nodes").insert({
        label: entry.title.length > 30 ? entry.title.slice(0, 30) + "…" : entry.title,
        node_type: nodeType,
        description: entry.description || null,
        ref_id: intelIds[i] || null,
        topic_id: topicId,
      }).select("id").single();
      graphNodeIds.push(nodeRow?.id || "");
    }

    // Graph connections from structured connections
    if (structured.connections?.length) {
      for (const conn of structured.connections) {
        const srcNodeId = graphNodeIds[conn.source_index];
        const tgtNodeId = graphNodeIds[conn.target_index];
        if (srcNodeId && tgtNodeId && srcNodeId !== tgtNodeId) {
          const edgeType = conn.connection_type === "financial" ? "financial"
            : conn.connection_type === "contradiction" ? "contradiction"
            : conn.connection_type === "temporal" ? "temporal_overlap"
            : "citation";
          await supabase.from("graph_connections").insert({
            source_node_id: srcNodeId,
            target_node_id: tgtNodeId,
            edge_type: edgeType,
            description: conn.description || null,
            evidence_id: evidenceRow.id,
          });
        }
      }
    }
  }

  // 8. Insert unknowns
  const unknownsInserted: string[] = [];
  if (structured.open_questions?.length) {
    for (const q of structured.open_questions) {
      await supabase.from("unknowns").insert({
        category: q.category || "open_question",
        title: q.title,
        description: q.description || null,
        source_intel_id: intelIds[0] || null,
        generated_by: "bridge_import",
      });
      unknownsInserted.push(q.title);
    }
  }

  return {
    evidence_id: evidenceRow.id,
    intel_entry_ids: intelIds,
    claims_created: claimsInserted,
    timeline_events_created: timelineIds.length,
    graph_nodes_created: graphNodeIds.length,
    connections_created: structured.connections?.length || 0,
    unknowns_generated: unknownsInserted,
    topic: structured.topic?.title || null,
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
      model: "google/gemini-2.5-flash",
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

const SYSTEM_PROMPT = `You are an intelligence analyst structuring content for a research platform. Extract EVERYTHING:

1. **Evidence**: The primary source document/article
2. **Intel Entries**: Create MULTIPLE entries — one for each significant person, organization, event, or document mentioned. For each, assign real-world lat/lng coordinates for their most relevant location (e.g., a person's headquarters, an event's city, an organization's HQ). Use precise coordinates.
3. **Claims**: Every distinct factual assertion. Label each as alleged/unsupported/disputed/verified/retracted.
4. **Connections**: Map relationships between intel entries (financial, organizational, personal, legal, temporal, evidentiary). Use indices into the intel_entries array.
5. **Timeline Events**: Every datable event with ISO dates. Use "main" branch for well-sourced events, "shadow" for speculative ones.
6. **Topic**: The overarching subject.
7. **Open Questions**: Gaps, missing documents, unknowns.

Be thorough — extract at least 3-5 intel entries, 2-4 claims, and all timeline events. Always assign locations where geographically relevant.`;

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
            SYSTEM_PROMPT,
            `Structure this extracted content.\n\nSource URL: ${url}\n\nExtracted content:\n${extractedContent}`,
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
            SYSTEM_PROMPT,
            `Structure this chat transcript / research text. Extract ALL entities, locations, dates, claims, and connections.\n\nSource: ${label}\n\nTranscript:\n${content}`,
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
