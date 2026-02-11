import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { query } = await req.json();
    if (!query || typeof query !== "string") {
      return new Response(JSON.stringify({ error: "Missing query" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are CLEARFIELD's Globe Intelligence AI. Users ask geographic questions and you return structured location data for rendering on a 3D globe.

Your job is to return accurate geographic coordinates and contextual information. You MUST use the generate_globe_data tool to return your response.

RULES:
- Return real, accurate latitude/longitude coordinates
- When mentioning any individual by name, always include the word "allegedly" in the description
- Never assert guilt or make accusations about individuals
- Only reference publicly documented information
- For density/distribution queries, return heatmapPoints spread across relevant regions
- For relationship queries, return arcs connecting related locations
- For single-location queries, return the specific point(s)
- Set "mode" based on what best visualizes the answer: "points" for specific places, "heatmap" for density/distribution, "arcs" for connections, "mixed" for combinations
- Camera should target the primary area of interest
- Summary should be 2-3 sentences, factual and neutral
- Return 1-15 locations, 0-20 heatmap points, 0-10 arcs as appropriate`;

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
          { role: "user", content: query },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_globe_data",
              description: "Return structured geographic data for rendering on the globe.",
              parameters: {
                type: "object",
                properties: {
                  locations: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        lat: { type: "number" },
                        lng: { type: "number" },
                        label: { type: "string" },
                        description: { type: "string" },
                        category: { type: "string" },
                        weight: { type: "number" },
                      },
                      required: ["lat", "lng", "label", "description", "category", "weight"],
                      additionalProperties: false,
                    },
                  },
                  heatmapPoints: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        lat: { type: "number" },
                        lng: { type: "number" },
                        weight: { type: "number" },
                      },
                      required: ["lat", "lng", "weight"],
                      additionalProperties: false,
                    },
                  },
                  arcs: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        startLat: { type: "number" },
                        startLng: { type: "number" },
                        endLat: { type: "number" },
                        endLng: { type: "number" },
                        label: { type: "string" },
                        description: { type: "string" },
                      },
                      required: ["startLat", "startLng", "endLat", "endLng", "label", "description"],
                      additionalProperties: false,
                    },
                  },
                  camera: {
                    type: "object",
                    properties: {
                      lat: { type: "number" },
                      lng: { type: "number" },
                      altitude: { type: "number" },
                    },
                    required: ["lat", "lng", "altitude"],
                    additionalProperties: false,
                  },
                  summary: { type: "string" },
                  mode: { type: "string", enum: ["points", "heatmap", "arcs", "mixed"] },
                },
                required: ["locations", "heatmapPoints", "arcs", "camera", "summary", "mode"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "generate_globe_data" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits in Settings." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      return new Response(JSON.stringify({ error: "AI service unavailable" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (toolCall?.function?.arguments) {
      const result = JSON.parse(toolCall.function.arguments);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fallback: try parsing content
    const content = data.choices?.[0]?.message?.content;
    if (content) {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    return new Response(JSON.stringify({ error: "Could not parse AI response" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("globe-query error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
