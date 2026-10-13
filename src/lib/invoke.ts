import { supabase } from "@/integrations/supabase/client";
import { withRetry } from "@/lib/retry";

export async function invokeFunction<T = Record<string, unknown>>(
  name: string,
  body: Record<string, unknown> = {},
): Promise<T> {
  return withRetry(async () => {
    const { data, error } = await supabase.functions.invoke(name, { body });
    if (error) throw error;
    if (data && typeof data === "object" && "error" in data && (data as { error?: unknown }).error) {
      throw new Error(String((data as { error: unknown }).error));
    }
    return data as T;
  });
}
