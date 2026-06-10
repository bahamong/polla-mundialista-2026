import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente Supabase público SIN cookies (anon). Se usa en páginas cacheables
 * (como la landing) para leer datos públicos sin forzar render dinámico y
 * para no golpear Supabase en cada visita.
 */
export function createPublicClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
