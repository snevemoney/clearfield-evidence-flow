import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { json } from "./http.ts";

export function serviceClient(): SupabaseClient {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) throw new Error("Supabase env not configured");
  return createClient(url, key);
}

export type AuthedCaller =
  | { ok: true; via: "jwt"; userId: string }
  | { ok: true; via: "cron"; userId: null };

/**
 * Fail closed. Accept a verified user JWT, or (when allowCron) a matching x-cron-secret.
 * CRON_SECRET must be set in the function environment for the cron path.
 * An unset or empty CRON_SECRET never matches.
 */
export async function requireCaller(
  req: Request,
  supabase: SupabaseClient,
  opts: { allowCron?: boolean } = {},
): Promise<AuthedCaller | { ok: false; response: Response }> {
  const cronSecret = Deno.env.get("CRON_SECRET") ?? "";
  const provided = req.headers.get("x-cron-secret") ?? "";
  if (opts.allowCron && cronSecret.length > 0 && provided.length > 0 && provided === cronSecret) {
    return { ok: true, via: "cron", userId: null };
  }

  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  if (token) {
    const { data, error } = await supabase.auth.getUser(token);
    if (!error && data.user) {
      return { ok: true, via: "jwt", userId: data.user.id };
    }
  }

  return { ok: false, response: json({ error: "Unauthorized" }, 401) };
}
