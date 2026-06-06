import Link from "next/link";
import {
  Trophy,
  Target,
  Clock,
  Users,
  ShieldCheck,
  BarChart3,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { getSettings } from "@/lib/queries";
import { formatCurrency } from "@/lib/utils";
import type { PublicLeaderboardRow } from "@/lib/types";

export default async function LandingPage() {
  const settings = await getSettings();
  const supabase = await createClient();
  const { data: lb } = await supabase.rpc("pm_public_leaderboard");
  const leaderboard = ((lb as PublicLeaderboardRow[]) ?? []).slice(0, 5);

  const name = settings.tournament_name || "Polla Mundialista FIFA 2026";
  const fee = Number(settings.entry_fee || 0);
  const currency = settings.currency || "COP";
  const publicLb = settings.public_leaderboard === "true";

  const features = [
    {
      icon: Target,
      title: "Predice cada partido",
      desc: "Elige ganador o empate en los 104 partidos del Mundial.",
    },
    {
      icon: Clock,
      title: "Cierre automático",
      desc: "Las apuestas se cierran 1 hora antes de cada partido.",
    },
    {
      icon: BarChart3,
      title: "Puntos en tiempo real",
      desc: "El ranking se actualiza al cargar cada resultado.",
    },
    {
      icon: Users,
      title: "Eliminación por fases",
      desc: "Si no alcanzas el puntaje mínimo, quedas fuera.",
    },
  ];

  return (
    <div className="min-h-screen">
      {/* NAV */}
      <header className="border-b border-border">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2 font-bold">
            <Trophy className="h-6 w-6 text-primary" />
            <span>{name}</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/login">
              <Button variant="ghost">Iniciar sesión</Button>
            </Link>
            <Link href="/register">
              <Button>Registrarme</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="pitch-gradient border-b border-border">
        <div className="container grid gap-8 py-20 md:grid-cols-2 md:items-center">
          <div className="animate-fade-up space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <Trophy className="h-3 w-3" /> FIFA World Cup 2026
            </span>
            <h1 className="text-4xl font-extrabold leading-tight md:text-5xl">
              Demuestra que sabes de fútbol y gánale a todos
            </h1>
            <p className="text-lg text-muted-foreground">
              Únete a la polla del Mundial 2026. Predice los resultados, suma
              puntos por cada acierto y sube en la tabla de clasificación.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/register">
                <Button size="lg" className="gap-2">
                  Comprar mi cupo <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline">
                  Ya tengo cuenta
                </Button>
              </Link>
            </div>
            {fee > 0 && (
              <p className="text-sm text-muted-foreground">
                Costo del cupo:{" "}
                <span className="font-bold text-foreground">
                  {formatCurrency(fee, currency)}
                </span>
              </p>
            )}
          </div>

          {/* Ranking público */}
          {publicLb && (
            <Card className="hover-lift animate-scale-in md:ml-auto md:w-full md:max-w-md">
              <CardContent className="p-6">
                <h3 className="mb-4 flex items-center gap-2 font-semibold">
                  <BarChart3 className="h-5 w-5 text-primary" /> Top 5
                  clasificación
                </h3>
                {leaderboard.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Aún no hay puntajes. ¡Sé el primero en participar!
                  </p>
                ) : (
                  <ol className="space-y-2">
                    {leaderboard.map((row, i) => (
                      <li
                        key={i}
                        className="flex items-center justify-between rounded-lg bg-secondary/40 px-3 py-2 text-sm"
                      >
                        <span className="flex items-center gap-3">
                          <span className="font-bold text-primary">
                            {row.position}
                          </span>
                          {row.full_name ?? "Participante"}
                        </span>
                        <span className="font-semibold">
                          {row.total_points} pts
                        </span>
                      </li>
                    ))}
                  </ol>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      {/* CÓMO FUNCIONA */}
      <section className="container py-16">
        <h2 className="mb-10 text-center text-3xl font-bold">
          ¿Cómo funciona?
        </h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <Card key={f.title} className="hover-lift group">
              <CardContent className="space-y-3 p-6">
                <f.icon className="h-8 w-8 text-primary transition-transform duration-300 group-hover:scale-110" />
                <h3 className="font-semibold">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* REGLAS BÁSICAS */}
      <section className="border-t border-border bg-secondary/20">
        <div className="container grid gap-8 py-16 md:grid-cols-2">
          <div className="space-y-4">
            <h2 className="text-3xl font-bold">Reglas básicas</h2>
            <ul className="space-y-2 text-muted-foreground">
              <li>• 1 punto por acertar el resultado (gana local, empate o gana visitante).</li>
              <li>• Las apuestas cierran 1 hora antes de cada partido.</li>
              <li>• Solo participan los cupos aprobados por el organizador.</li>
              <li>• Puedes editar tu predicción hasta el cierre.</li>
              <li>• Se elimina a quien no alcance el puntaje mínimo por fase.</li>
            </ul>
            <Link href="/register">
              <Button className="gap-2">
                Quiero participar <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          <Card>
            <CardContent className="space-y-3 p-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2 font-semibold text-foreground">
                <ShieldCheck className="h-5 w-5 text-primary" /> Juego
                responsable
              </div>
              <p>
                Esta polla es una participación interna y recreativa entre
                conocidos. Participa solo si eres mayor de edad. No se promueve
                el juego con dinero real automatizado; los cupos y premios son
                gestionados de forma privada por el organizador.
              </p>
              <p>
                Al registrarte aceptas los términos y condiciones y el uso
                responsable de la plataforma.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="container py-8 text-center text-sm text-muted-foreground">
          {name} · Hecho por Luis Miguel Bahamón González
        </div>
      </footer>
    </div>
  );
}
