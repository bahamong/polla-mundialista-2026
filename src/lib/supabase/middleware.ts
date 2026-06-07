import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  REMEMBER_COOKIE,
  REMEMBER_MAX_AGE,
  wantsPersistent,
} from "@/lib/auth-cookies";

type CookieToSet = { name: string; value: string; options?: CookieOptions };

/**
 * Refresca la sesión de Supabase en cada request y protege rutas privadas.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const persistent = wantsPersistent(
    request.cookies.get(REMEMBER_COOKIE)?.value,
  );

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            const isDelete = !value || options?.maxAge === 0;
            const opts = isDelete
              ? options
              : {
                  ...options,
                  maxAge: persistent ? REMEMBER_MAX_AGE : undefined,
                  expires: undefined,
                };
            supabaseResponse.cookies.set(name, value, opts);
          });
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  const protectedPrefixes = [
    "/dashboard",
    "/matches",
    "/my-predictions",
    "/leaderboard",
    "/profile",
    "/admin",
  ];

  const isProtected = protectedPrefixes.some((p) => path.startsWith(p));

  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", path);
    return NextResponse.redirect(url);
  }

  // Si ya está autenticado y va a login/register -> dashboard
  if (user && (path === "/login" || path === "/register")) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
