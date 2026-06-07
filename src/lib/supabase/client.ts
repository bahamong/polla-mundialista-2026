import { createBrowserClient } from "@supabase/ssr";
import { REMEMBER_COOKIE, REMEMBER_MAX_AGE } from "@/lib/auth-cookies";

export function createClient() {
  // Persistente por defecto; sesión-solo si pm-remember = "0".
  let maxAge: number | undefined = REMEMBER_MAX_AGE;
  if (typeof document !== "undefined") {
    const m = document.cookie.match(
      new RegExp(`(?:^|;\\s*)${REMEMBER_COOKIE}=([^;]+)`),
    );
    if (m && m[1] === "0") maxAge = undefined; // cookie de sesión
  }

  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookieOptions: { maxAge } },
  );
}
