import { z } from "zod";

export const CLAIM_LABELS = ["user_claim", "opinion", "interpretation"] as const;
export const CLAIM_STATUSES = ["supported", "disputed", "unsupported", "under_review"] as const;
export const EVIDENCE_SOURCE_TYPES = [
  "news",
  "court_filing",
  "government_doc",
  "academic_paper",
  "media_transcript",
  "dataset",
  "historical_record",
] as const;
export const EVIDENCE_CREDIBILITY = [
  "primary",
  "secondary",
  "original",
  "syndicated",
  "on_record",
  "anonymous",
] as const;
export const NOTE_TARGET_TYPES = ["claim", "evidence"] as const;
export const UNKNOWN_CATEGORIES = [
  "known_fact",
  "disputed_claim",
  "unknown",
  "missing_document",
  "redaction",
  "open_question",
] as const;

const uuid = z.string().uuid();
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const claimInsertSchema = z.object({
  title: z.string().trim().min(1).max(500),
  content: z.string().trim().min(1).max(20000),
  label: z.enum(CLAIM_LABELS),
  status: z.enum(CLAIM_STATUSES),
});

export const evidenceInsertSchema = z.object({
  title: z.string().trim().min(1).max(500),
  source_type: z.enum(EVIDENCE_SOURCE_TYPES),
  author: z.string().trim().max(300).nullable(),
  excerpt: z.string().trim().max(5000).nullable(),
  credibility: z.enum(EVIDENCE_CREDIBILITY),
  url: z.preprocess((v) => (v === "" ? null : v), z.string().url().max(2000).nullable()),
  published_date: z.preprocess((v) => (v === "" ? null : v), isoDate.nullable()),
});

export const contextNoteInsertSchema = z.object({
  content: z.string().trim().min(1).max(10000),
  target_type: z.enum(NOTE_TARGET_TYPES),
  target_id: uuid,
  evidence_id: uuid.nullable(),
});

export const unknownInsertSchema = z.object({
  title: z.string().trim().min(1).max(500),
  description: z.string().trim().max(10000).nullable(),
  category: z.enum(UNKNOWN_CATEGORIES),
  generated_by: z.literal("user"),
});

export const claimEvidenceInsertSchema = z.object({
  claim_id: uuid,
  evidence_id: uuid,
});

function required<T>(value: T | undefined, name: string): T {
  if (value === undefined) throw new Error(`Missing ${name}`);
  return value;
}

export function parseClaimInsert(input: unknown) {
  const p = claimInsertSchema.parse(input);
  return {
    title: required(p.title, "title"),
    content: required(p.content, "content"),
    label: required(p.label, "label"),
    status: required(p.status, "status"),
  };
}

export function parseEvidenceInsert(input: unknown) {
  const p = evidenceInsertSchema.parse(input);
  return {
    title: required(p.title, "title"),
    source_type: required(p.source_type, "source_type"),
    author: p.author ?? null,
    excerpt: p.excerpt ?? null,
    credibility: required(p.credibility, "credibility"),
    url: p.url ?? null,
    published_date: p.published_date ?? null,
  };
}

export function parseContextNoteInsert(input: unknown) {
  const p = contextNoteInsertSchema.parse(input);
  return {
    content: required(p.content, "content"),
    target_type: required(p.target_type, "target_type"),
    target_id: required(p.target_id, "target_id"),
    evidence_id: p.evidence_id ?? null,
  };
}

export function parseUnknownInsert(input: unknown) {
  const p = unknownInsertSchema.parse(input);
  return {
    title: required(p.title, "title"),
    description: p.description ?? null,
    category: required(p.category, "category"),
    generated_by: "user" as const,
  };
}

export function parseClaimEvidenceInsert(input: unknown) {
  const p = claimEvidenceInsertSchema.parse(input);
  return {
    claim_id: required(p.claim_id, "claim_id"),
    evidence_id: required(p.evidence_id, "evidence_id"),
  };
}

export function toIsoDate(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const trimmed = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  if (/^\d{4}-\d{2}$/.test(trimmed)) return `${trimmed}-01`;
  if (/^\d{4}$/.test(trimmed)) return `${trimmed}-01-01`;
  const d = new Date(trimmed);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}
