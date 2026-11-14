import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { Wordmark } from "@/components/wordmark";

// Moldura de todas as telas: brilho no fundo, logo (volta para a landing) e botão de tema
export function PageShell({ nav, children }: { nav?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="relative flex flex-1 flex-col overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(60rem_40rem_at_85%_10%,var(--glow),transparent_70%)]"
      />

      <header className="relative mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-5 py-5 sm:px-8">
        <Link href="/" className="text-4xl sm:text-5xl">
          <Wordmark />
        </Link>
        <nav className="flex items-center gap-2 sm:gap-4">
          {nav}
          <ThemeToggle />
        </nav>
      </header>

      {children}
    </div>
  );
}

// Etiqueta com o código da sala, no canto do cabeçalho
export function RoomBadge({ code }: { code: string }) {
  return (
    <span className="rounded-full bg-accent px-3 py-1 font-display text-base font-semibold tracking-widest text-accent-foreground sm:text-lg">
      <span className="hidden tracking-normal sm:inline">Sala </span>
      {code}
    </span>
  );
}
