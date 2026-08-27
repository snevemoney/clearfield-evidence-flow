import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/http.ts";
import { requireCaller, serviceClient } from "../_shared/auth.ts";
import { fetchWithRetry } from "../_shared/retry.ts";

const DEFAULT_TOPICS = [
  "Jeffrey Epstein court filings case numbers 2019 2020 document titles",
  "Epstein flight logs Lolita Express passenger manifests names dates",
  "Ghislaine Maxwell trial exhibits evidence documents presented",
  "Epstein black book contacts names addresses revealed",
  "Epstein victim depositions testimony key statements",
  "Epstein financial records shell companies bank accounts",
  "DOJ Epstein investigation declassified documents released",
  "Epstein island visitor logs Little St James records",
];

interface DocumentEntry {
  title: string;
  source: string;
  total_pages: number;
  pages: {
    page_number: number;
    extracted_text: string;
    has_redactions: boolean;
    redaction_count: number;
  }[];
}

async function fetchFromPerplexity(topic: string, apiKey: string): Promise<string> {
  const res = await fetchWithRetry("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "sonar-pro",
      messages: [
        {
          role: "system",
          content: "You are a research assistant specializing in legal documents and court filings. Provide detailed, factual information about real documents including titles, case numbers, dates, content excerpts, and notable redactions. Be thorough and specific."
        },
        {
          role: "user",
          content: `Provide detailed information about the following topic, including specific document titles, case numbers, dates, content excerpts, and any known redactions: ${topic}. List as many specific documents as possible with real details.`
        },
      ],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Perplexity API error [${res.status}]: ${errText}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || "";
}

async function extractStructuredDocs(rawText: string, topic: string, apiKey: string): Promise<DocumentEntry[]> {
  const res = await fetchWithRetry("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        {
          role: "system",
          content: "You are an OCR and document indexing engine. Extract structured document records from research text. Each document should have realistic page-level text excerpts simulating OCR output from scanned court/legal PDFs. Include redaction markers where mentioned."
        },
        {
          role: "user",
          content: `From this research about "${topic}", extract 8-15 distinct documents. For each document create 3-10 pages of realistic OCR-extracted text content.\n\nResearch text:\n${rawText}`
        },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "index_documents",
            description: "Index extracted documents with page-level OCR text into the archive",
            parameters: {
              type: "object",
              properties: {
                documents: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string", description: "Full document title with case number if applicable" },
                      source: { type: "string", description: "Source e.g. DOJ RELEASE, COURT FILING, DEPOSITION, FOIA" },
                      total_pages: { type: "integer", description: "Estimated total pages" },
                      pages: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            page_number: { type: "integer" },
                            extracted_text: { type: "string", description: "OCR-extracted text content for this page, 200-800 words. Include [REDACTED] markers where applicable." },
                            has_redactions: { type: "boolean" },
                            redaction_count: { type: "integer" },
                          },
                          required: ["page_number", "extracted_text", "has_redactions", "redaction_count"],
                          additionalProperties: false,
                        },
                      },
                    },
                    required: ["title", "source", "total_pages", "pages"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["documents"],
              additionalProperties: false,
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "index_documents" } },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Lovable AI error [${res.status}]: ${errText}`);
  }

  const data = await res.json();
  const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
  if (!toolCall) throw new Error("No tool call in AI response");

  const parsed = JSON.parse(toolCall.function.arguments);
  return parsed.documents || [];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");
    if (!PERPLEXITY_API_KEY) throw new Error("PERPLEXITY_API_KEY not configured");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabase = serviceClient();
    const auth = await requireCaller(req, supabase);
    if (!auth.ok) return auth.response;

    let body: { topics?: string[] } = {};
    try {
      body = await req.json();
    } catch (e) {
      console.info("seed-document-archive: empty or invalid JSON body, using defaults", e);
    }

    const topics = body.topics?.length ? body.topics : DEFAULT_TOPICS;
    const results: { topic: string; documents: number; pages: number }[] = [];

    for (const topic of topics) {
      try {
        console.log(`Processing topic: ${topic}`);

        // Step 1: Fetch from Perplexity
        const rawText = await fetchFromPerplexity(topic, PERPLEXITY_API_KEY);
        console.log(`Got ${rawText.length} chars from Perplexity for: ${topic}`);

        // Step 2: Extract structured docs via Lovable AI
        const docs = await extractStructuredDocs(rawText, topic, LOVABLE_API_KEY);
        console.log(`Extracted ${docs.length} documents for: ${topic}`);

        let topicPages = 0;

        for (const doc of docs) {
          // Insert document
          const { data: docRow, error: docError } = await supabase
            .from("documents")
            .insert({
              title: doc.title,
              source: doc.source,
              total_pages: doc.total_pages,
              status: "processed",
              metadata: { topic, indexed_at: new Date().toISOString() },
            })
            .select("id")
            .single();

          if (docError) {
            console.error(`Failed to insert doc "${doc.title}":`, docError.message);
            continue;
          }

          // Insert pages
          if (doc.pages?.length) {
            const pageRows = doc.pages.map((p) => ({
              document_id: docRow.id,
              page_number: p.page_number,
              extracted_text: p.extracted_text,
              has_redactions: p.has_redactions,
              redaction_count: p.redaction_count,
            }));

            const { error: pageError } = await supabase
              .from("document_pages")
              .insert(pageRows);

            if (pageError) {
              console.error(`Failed to insert pages for "${doc.title}":`, pageError.message);
            } else {
              topicPages += doc.pages.length;
            }
          }

          // Also create an intel_entry for cross-referencing
          await supabase.from("intel_entries").insert({
            title: doc.title,
            description: `Archived document: ${doc.source}. ${doc.total_pages} pages indexed.`,
            category: "document",
            source_type: "archive",
            fact_check_status: "unverified",
            tags: ["archive", "document", topic.split(" ").slice(0, 3).join("-").toLowerCase()],
          });
        }

        results.push({ topic, documents: docs.length, pages: topicPages });
      } catch (topicError) {
        console.error(`Error processing topic "${topic}":`, topicError);
        results.push({ topic, documents: 0, pages: 0 });
      }
    }

    const totalDocs = results.reduce((s, r) => s + r.documents, 0);
    const totalPages = results.reduce((s, r) => s + r.pages, 0);

    return new Response(
      JSON.stringify({
        success: true,
        summary: `Indexed ${totalDocs} documents with ${totalPages} pages across ${topics.length} topics`,
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("seed-document-archive error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
