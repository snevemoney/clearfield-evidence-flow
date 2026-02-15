import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { topic, parentLayer, direction } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const contextInfo = parentLayer
      ? `The user is drilling deeper from this layer:
Title: ${parentLayer.title}
Known: ${parentLayer.known}
Disputed: ${parentLayer.disputed}
Unknown: ${parentLayer.unknown}
They chose to explore the direction: "${direction}"`
      : `The user wants to start exploring the topic: "${topic}"`;

    const currentDepth = parentLayer ? (parentLayer.depth || 1) + 1 : 1;

    const systemPrompt = `You are CLEARFIELD's Rabbit Hole Navigator — an AI research assistant that generates structured investigation paths for publicly documented topics.

Your job is to create ONE exploration layer with these sections:
- title: A compelling title for this layer (max 8 words)
- depth: The number ${currentDepth} (this is depth level ${currentDepth} of 10)
- known: 2-3 sentences of well-documented, publicly sourced facts about this aspect
- disputed: 2-3 sentences about what's debated or contested, with brief mention of competing narratives
- unknown: 1-2 sentences about what remains genuinely unknown or unverified
- forks: Exactly 3 possible directions to explore deeper, each with a short label (max 5 words) and a one-sentence description

DEPTH-BASED TONE ESCALATION (current depth: ${currentDepth}/10):
The deeper the user goes, the more you should explore the darker, more obscure, and more unsettling corners of the topic.

- Depth 1-2 (SURFACE): Mainstream, well-reported facts. Wikipedia-level overview. Neutral journalistic tone.
- Depth 3-4 (BENEATH THE SURFACE): Investigative journalism territory. Mention lesser-known connections, follow-the-money angles, and institutional failures that mainstream coverage glossed over.
- Depth 5-6 (DEEP CURRENTS): Declassified documents, FOIA revelations, whistleblower testimony, court depositions that paint a much darker picture. Reference specific documents and dates. The tone should feel like a late-night investigative documentary.
- Depth 7-8 (THE ABYSS): The most disturbing publicly documented details — sealed indictments, redacted reports, witness testimony that was suppressed or recanted under pressure. Cross-reference with known intelligence operations and power networks. The tone should feel heavy and unsettling.
- Depth 9-10 (BEDROCK): The structural unknowns — what was deliberately destroyed, who was never investigated, what patterns emerge when you connect everything above. Reference the limits of public knowledge itself. The tone should feel like staring into something that stares back.

IMPORTANT RULES:
- Only reference publicly documented information (court filings, declassified docs, investigative journalism, academic research)
- Clearly distinguish between verified facts, disputed claims, and speculation
- Never assert conspiracy theories as fact — but DO explore the darkest verified/documented territory at deeper levels
- Be specific — reference real documents, dates, institutions, and events where possible
- At deeper levels, the "unknown" section should feel genuinely unsettling — what CAN'T we find out and why?
- Forks at deeper levels should lead toward increasingly disturbing but still documentable directions

Respond with valid JSON matching this schema:
{
  "title": "string",
  "depth": number,
  "known": "string",
  "disputed": "string",
  "unknown": "string",
  "forks": [
    { "label": "string", "description": "string" },
    { "label": "string", "description": "string" },
    { "label": "string", "description": "string" }
  ]
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: contextInfo },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_layer",
              description: "Generate a structured exploration layer for the Rabbit Hole Navigator.",
              parameters: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  depth: { type: "number" },
                  known: { type: "string" },
                  disputed: { type: "string" },
                  unknown: { type: "string" },
                  forks: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        label: { type: "string" },
                        description: { type: "string" },
                      },
                      required: ["label", "description"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["title", "depth", "known", "disputed", "unknown", "forks"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "generate_layer" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits in Settings." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      return new Response(JSON.stringify({ error: "AI service unavailable" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (toolCall?.function?.arguments) {
      const layer = JSON.parse(toolCall.function.arguments);
      return new Response(JSON.stringify({ layer }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fallback: try parsing content directly
    const content = data.choices?.[0]?.message?.content;
    if (content) {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const layer = JSON.parse(jsonMatch[0]);
        return new Response(JSON.stringify({ layer }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    return new Response(JSON.stringify({ error: "Could not parse AI response" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("rabbit-hole error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
