"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Trophy, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { REMEMBER_MAX_AGE } from "@/lib/auth-cookies";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const redirect = params.get("redirect") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Fija la preferencia ANTES de crear el cliente (define la vida de las cookies)
    const secure = window.location.protocol === "https:" ? "; secure" : "";
    document.cookie = remember
      ? `pm-remember=1; path=/; max-age=${REMEMBER_MAX_AGE}; samesite=lax${secure}`
      : `pm-remember=0; path=/; samesite=lax${secure}`;

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      setError("Credenciales inválidas. Verifica tu correo y contraseña.");
      setLoading(false);
      return;
    }
    router.push(redirect);
    router.refresh();
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-2 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/15">
          <Trophy className="h-6 w-6 text-primary" />
        </div>
        <CardTitle className="text-2xl">Iniciar sesión</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Correo electrónico</Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tucorreo@ejemplo.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <PasswordInput
              id="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          <label className="flex cursor-pointer select-none items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="h-4 w-4 accent-primary"
            />
            Mantener sesión iniciada (30 días)
          </label>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Entrar
          </Button>
        </form>
        <p className="mt-3 text-center text-sm">
          <Link
            href="/forgot-password"
            className="text-muted-foreground hover:text-primary"
          >
            ¿Olvidaste tu contraseña?
          </Link>
        </p>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          ¿No tienes cuenta?{" "}
          <Link href="/register" className="font-medium text-primary">
            Regístrate
          </Link>
        </p>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          <Link href="/">← Volver al inicio</Link>
        </p>
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Suspense fallback={<Loader2 className="h-6 w-6 animate-spin" />}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
