import { createBrowserClient } from "@supabase/ssr";

// La sesión se guarda en cookies persistentes (~400 días por defecto en
// @supabase/ssr), de modo que el usuario permanece logueado entre visitas.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
