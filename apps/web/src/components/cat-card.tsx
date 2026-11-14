import { CatImage } from "@/components/cat-image";
import type { Cat } from "@/lib/api";

// O réu da vez: foto, nome e crime. Lado a lado quando há espaço (telão), empilhado no celular.
export function CatCard({ cat, number, total }: { cat: Cat; number: number; total: number }) {
  return (
    <article className="@container motion-safe:animate-rise">
      <div className="grid gap-6 @2xl:grid-cols-2 @2xl:items-center @2xl:gap-10">
        {/* No celular a altura é limitada, para os botões de voto caberem sem rolar */}
        <CatImage
          cat={cat}
          className="aspect-square max-h-[38dvh] w-full rounded-4xl border-4 border-card shadow-2xl shadow-primary/25 @2xl:max-h-none"
        />
        <div>
          <p className="inline-block -rotate-2 rounded-full bg-accent px-4 py-1 font-display text-sm font-semibold text-accent-foreground @2xl:text-base">
            Réu {number} de {total}
          </p>
          <h2 className="mt-3 font-display text-4xl font-bold leading-tight @2xl:text-6xl">{cat.name}</h2>
          <div className="mt-5 rounded-3xl border-2 border-dashed bg-card p-5 @2xl:p-7">
            <p className="font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Acusado de
            </p>
            <p className="mt-1 text-xl font-semibold leading-snug @2xl:text-3xl">{cat.crime}</p>
          </div>
        </div>
      </div>
    </article>
  );
}
