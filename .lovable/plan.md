

# Add Text Paste Mode to Bridge Import

## What This Does
Adds a second tab to the Bridge Import page so you can paste raw chat transcripts (like your conversations from thewebb.io) and have CLEARFIELD automatically extract evidence objects, intel entries, timeline events, and open questions from them — the same way it does with URLs, but without needing a link.

## How It Works

1. You go to `/import` and switch to the **TEXT MODE** tab
2. Paste your chat transcript into the text area
3. Optionally add a source label (e.g. "thewebb.io - Epstein Saudi Arabia research")
4. Click **IMPORT and EXTRACT**
5. The AI reads the transcript, identifies factual claims, entities, dates, and questions, then creates the same database entries as URL mode

## Changes

### 1. Bridge Import Page (`src/pages/BridgeImport.tsx`)

- Add a Tabs component at the top with two tabs: **URL MODE** and **TEXT MODE**
- URL mode remains exactly as-is
- Text mode shows:
  - A larger textarea (taller, since transcripts are long) for pasting raw chat content
  - An "Source Label" input field so you can tag the origin (e.g. "thewebb.io chat - Feb 15")
  - Character count display (max 10,000 characters per submission)
  - Same "IMPORT and EXTRACT" button
- Results display is shared between both modes — same success/error cards with evidence titles, intel entries, and open questions

### 2. Edge Function (`supabase/functions/bridge-import/index.ts`)

- Accept a new optional field in the request body: `texts` — an array of `{ content: string, source_label?: string }`
- The function accepts either `urls` or `texts` (or both)
- For text entries:
  - **Skip** the Perplexity extraction step (content is already provided — no URL to scrape)
  - Send the raw text directly to the Lovable AI structuring step with the same tool-calling schema
  - Adjust the AI system prompt to handle chat transcripts: "You are an intelligence analyst structuring a research conversation transcript into evidence objects..."
  - Store `source_label` as the evidence `author` field and leave `url` as null
- Same database insertion logic: evidence, intel_entries, timeline_events, unknowns
- Text content is capped at 10,000 characters per entry to stay within AI context limits

### 3. No Database Changes
- Uses the same existing tables: `evidence`, `intel_entries`, `unknowns`, `timeline_events`
- Evidence from text paste will default to `source_type: "media_transcript"` unless the AI determines otherwise
- The `url` field on evidence will be null for text-pasted entries

## Technical Details

**Frontend changes (`BridgeImport.tsx`):**
- Import `Tabs, TabsList, TabsTrigger, TabsContent` from UI components
- Import `Input` for the source label field
- Add state: `mode` (tab), `pasteText`, `sourceLabel`
- New `handleTextImport` function that calls the same edge function with `{ texts: [{ content, source_label }] }`
- Update `ImportResult` interface: `url` becomes optional (text imports won't have one), add optional `source_label` field
- Results cards show source label instead of URL for text imports

**Edge function changes (`bridge-import/index.ts`):**
- Destructure `{ urls, texts }` from request body
- Validate that at least one of them is provided
- Process text entries in a loop similar to URL entries but skip the Perplexity call
- The AI prompt for text mode emphasizes extracting multiple evidence objects from a single long transcript when appropriate
- For the example transcript shared, the AI would likely extract:
  - Evidence: "Austrian Passport Listing Saudi Arabia Residence" 
  - Evidence: "2016 Saudi Travel Planning with MBS Invitation"
  - Intel entries for entities like Epstein, MBS, Rybolovlev
  - Timeline events for 1980s passport stamps, 2016 visa planning, 2019 arrest
  - Open questions from the "Dig Deeper" sections

