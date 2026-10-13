/** Escape ILIKE wildcards. */
export function escapeIlike(raw: string): string {
  return raw.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}

/** Strip PostgREST `.or()` reserved punctuation so user text cannot break the filter. */
export function sanitizeOrValue(raw: string): string {
  return raw.replace(/[,()]/g, " ").replace(/\s+/g, " ").trim();
}

export function safeIlikePattern(raw: string): string {
  return escapeIlike(sanitizeOrValue(raw));
}
