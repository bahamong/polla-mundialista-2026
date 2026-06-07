import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import {
  REMEMBER_COOKIE,
  REMEMBER_MAX_AGE,
  wantsPersistent,
} from "@/lib/auth-cookies";

type CookieToSet = { name: string; value: string; options?: CookieOptions };

export async function createClient() {
  const cookieStore = await cookies();
  const persistent = wantsPersistent(cookieStore.get(REMEMBER_COOKIE)?.value);

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              const opts = !value
                ? options // borrado de cookie (logout): respetar
                : {
                    ...options,
                    maxAge: persistent ? REMEMBER_MAX_AGE : undefined,
                  };
              cookieStore.set(name, value, opts);
            });
          } catch {
            // Llamado desde un Server Component; el middleware refresca la sesión.
          }
        },
      },
    },
  );
}
