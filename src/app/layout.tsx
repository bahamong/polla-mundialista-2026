import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Polla Mundialista FIFA 2026",
  description:
    "Predice los resultados del Mundial FIFA 2026, suma puntos y compite por el primer lugar.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className="dark">
      <body className="antialiased">{children}</body>
    </html>
  );
}
