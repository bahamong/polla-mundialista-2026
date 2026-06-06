"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Trophy, LogOut, Menu, X, Shield } from "lucide-react";
import type { Profile } from "@/lib/types";

const NAV = [
  { href: "/dashboard", label: "Inicio" },
  { href: "/matches", label: "Partidos" },
  { href: "/my-predictions", label: "Mis Predicciones" },
  { href: "/leaderboard", label: "Clasificación" },
  { href: "/rules", label: "Reglas" },
  { href: "/profile", label: "Perfil" },
];

export function Navbar({ profile }: { profile: Profile }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const isAdmin = profile.role === "admin" || profile.role === "superadmin";

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
      <div className="container flex h-16 items-center justify-between gap-4">
        <Link href="/dashboard" className="flex items-center gap-2 font-bold">
          <Trophy className="h-6 w-6 text-primary" />
          <span className="hidden sm:inline">Polla Mundial 2026</span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-secondary",
                pathname === item.href
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground",
              )}
            >
              {item.label}
            </Link>
          ))}
          {isAdmin && (
            <Link
              href="/admin"
              className={cn(
                "flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium text-accent hover:bg-secondary",
                pathname.startsWith("/admin") && "bg-secondary",
              )}
            >
              <Shield className="h-4 w-4" /> Admin
            </Link>
          )}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <span className="text-sm text-muted-foreground">
            {profile.full_name}
          </span>
          <Button variant="ghost" size="icon" onClick={signOut} title="Salir">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {open && (
        <nav className="border-t border-border bg-background px-4 pb-4 lg:hidden">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="block rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary"
            >
              {item.label}
            </Link>
          ))}
          {isAdmin && (
            <Link
              href="/admin"
              onClick={() => setOpen(false)}
              className="block rounded-md px-3 py-2 text-sm font-medium text-accent hover:bg-secondary"
            >
              Panel Admin
            </Link>
          )}
          <button
            onClick={signOut}
            className="mt-2 flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-destructive hover:bg-secondary"
          >
            <LogOut className="h-4 w-4" /> Cerrar sesión
          </button>
        </nav>
      )}
    </header>
  );
}
