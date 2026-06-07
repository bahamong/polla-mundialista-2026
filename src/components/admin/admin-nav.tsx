"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/admin", label: "Resumen" },
  { href: "/admin/users", label: "Usuarios" },
  { href: "/admin/payments", label: "Pagos" },
  { href: "/admin/teams", label: "Equipos" },
  { href: "/admin/matches", label: "Partidos" },
  { href: "/admin/results", label: "Resultados" },
  { href: "/admin/settings", label: "Configuración" },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav className="flex flex-wrap gap-2 border-b border-border pb-3">
      {LINKS.map((l) => {
        const active =
          l.href === "/admin"
            ? pathname === "/admin"
            : pathname.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              active
                ? "bg-accent/20 text-accent"
                : "text-muted-foreground hover:bg-secondary",
            )}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
