import { createBrowserClient, type CookieOptions } from "@supabase/ssr";
import { REMEMBER_COOKIE, REMEMBER_MAX_AGE } from "@/lib/auth-cookies";

type CookieToSet = { name: string; value: string; options?: CookieOptions };

// Adaptador de cookies propio para el navegador: impone máximo 30 días
// (o cookie de sesión si el usuario desmarca "Mantener sesión iniciada"),
// ya que @supabase/ssr fuerza por defecto ~400 días.
function isPersistent(): boolean {
  if (typeof document === "undefined") return true;
  const m = document.cookie.match(
    new RegExp(`(?:^|;\\s*)${REMEMBER_COOKIE}=([^;]*)`),
  );
  return !m || m[1] !== "0";
}

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          if (typeof document === "undefined" || !document.cookie) return [];
          return document.cookie
            .split(";")
            .map((pair) => {
              const idx = pair.indexOf("=");
              const name = decodeURIComponent(pair.slice(0, idx).trim());
              const value = decodeURIComponent(pair.slice(idx + 1).trim());
              return { name, value };
            })
            .filter((c) => c.name);
        },
        setAll(cookiesToSet: CookieToSet[]) {
          const keep = isPersistent();
          const secure =
            typeof window !== "undefined" &&
            window.location.protocol === "https:";
          cookiesToSet.forEach(({ name, value, options }) => {
            const segs = [
              `${encodeURIComponent(name)}=${encodeURIComponent(value ?? "")}`,
            ];
            segs.push(`path=${options?.path ?? "/"}`);
            segs.push(`samesite=${options?.sameSite ?? "lax"}`);
            const isDelete = !value || options?.maxAge === 0;
            if (isDelete) {
              segs.push("max-age=0");
            } else if (keep) {
              segs.push(`max-age=${REMEMBER_MAX_AGE}`);
            } // si no es persistente: sin max-age -> cookie de sesión
            if (secure) segs.push("secure");
            document.cookie = segs.join("; ");
          });
        },
      },
    },
  );
}
