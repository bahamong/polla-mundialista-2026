"use client";

import { useState } from "react";
import Link from "next/link";
import { Trophy, Loader2, MailCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const base =
      process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${base}/auth/callback?next=/reset-password`,
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="hover-lift w-full max-w-md text-center">
          <CardContent className="space-y-4 p-8">
            <MailCheck className="mx-auto h-12 w-12 text-primary" />
            <h2 className="text-xl font-bold">Revisa tu correo</h2>
            <p className="text-sm text-muted-foreground">
              Si <span className="font-medium text-foreground">{email}</span>{" "}
              está registrado, te enviamos un enlace para restablecer tu
              contraseña.
            </p>
            <Link href="/login">
              <Button className="w-full">Volver a iniciar sesión</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="hover-lift w-full max-w-md animate-scale-in">
        <CardHeader className="space-y-2 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/15">
            <Trophy className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Recuperar contraseña</CardTitle>
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
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Enviar enlace
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            <Link href="/login" className="font-medium text-primary">
              ← Volver a iniciar sesión
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
