import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { ClipboardList, Plus, Settings } from "lucide-react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Foco Clinico",
  description: "Captura rapida de casos hospitalizados por cama",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Foco Clinico",
    statusBarStyle: "default"
  }
};

export const viewport: Viewport = {
  themeColor: "#f7f8f8",
  width: "device-width",
  initialScale: 1
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>
        <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col">
          <header className="sticky top-0 z-20 border-b border-zinc-200 bg-[#f7f8f8]/95 px-4 py-3 backdrop-blur">
            <div className="flex items-center justify-between">
              <Link href="/" className="flex items-center gap-2 text-base font-semibold text-zinc-950">
                <ClipboardList size={22} aria-hidden />
                Foco Clinico
              </Link>
              <nav className="flex items-center gap-1">
                <Link
                  href="/new"
                  className="grid h-10 w-10 place-items-center rounded-md border border-zinc-200 bg-white text-zinc-900 shadow-sm"
                  aria-label="Nuevo caso"
                  title="Nuevo caso"
                >
                  <Plus size={20} aria-hidden />
                </Link>
                <Link
                  href="/settings"
                  className="grid h-10 w-10 place-items-center rounded-md border border-zinc-200 bg-white text-zinc-900 shadow-sm"
                  aria-label="Configuracion"
                  title="Configuracion"
                >
                  <Settings size={20} aria-hidden />
                </Link>
              </nav>
            </div>
          </header>
          <main className="flex-1 px-4 py-4 safe-bottom">{children}</main>
        </div>
      </body>
    </html>
  );
}
