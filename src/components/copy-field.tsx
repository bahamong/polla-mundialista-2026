"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

export function CopyField({
  value,
  display,
  label,
}: {
  /** Texto que se copia al portapapeles (sin espacios para pegar limpio). */
  value: string;
  /** Texto que se muestra en pantalla. Si no se pasa, se usa `value`. */
  display?: string;
  /** Descripción accesible, p. ej. "el número Nequi". */
  label?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // El portapapeles puede no estar disponible (contexto no seguro); se ignora.
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={`Copiar ${label ?? value}`}
      className="group flex items-center gap-2 rounded-md text-left outline-none transition focus-visible:ring-2 focus-visible:ring-primary"
    >
      <span className="text-2xl font-extrabold tracking-wide">
        {display ?? value}
      </span>
      {copied ? (
        <Check className="h-5 w-5 shrink-0 text-emerald-400" />
      ) : (
        <Copy className="h-5 w-5 shrink-0 text-muted-foreground transition group-hover:text-primary" />
      )}
    </button>
  );
}
