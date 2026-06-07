import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Verifica enlaces de correo (recuperación de contraseña, confirmación de
 * registro, etc.) usando token_hash + verifyOtp. Este flujo funciona en
 * cualquier dispositivo/navegador (no depende del verificador PKCE).
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/dashboard";

  if (token_hash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Enlace inválido o expirado
  return NextResponse.redirect(`${origin}/forgot-password?error=expired`);
}
