import { Crown, Moon } from "lucide-react";
import { CatImage } from "@/components/cat-image";
import type { SessionView } from "@/lib/api";
import { plural } from "@/lib/text";

type Summary = NonNullable<SessionView["summary"]>;

// Resumo do FIM: o gato mais culpado e a Prisão da Soneca (condenados na ordem do julgamento)
export function FinalSummary({ summary, totalCats }: { summary: Summary; totalCats: number }) {
  const { prison, mostGuilty } = summary;

  return (
    <section className="flex flex-col gap-12 motion-safe:animate-rise">
      <div className="text-center">
        <h2 className="font-display text-4xl font-bold sm:text-5xl">Fim do julgamento!</h2>
        <p className="mt-2 text-lg text-muted-foreground">
          {plural(prison.length, "gato condenado", "gatos condenados")} de {totalCats}.
        </p>
      </div>

      <div className="mx-auto w-full max-w-2xl rounded-4xl border-2 bg-card p-6 shadow-xl shadow-primary/15 sm:p-8">
        <h3 className="flex items-center justify-center gap-2 font-display text-2xl font-bold">
          <Crown className="size-7 text-accent" strokeWidth={2.5} />
          Gato mais culpado
        </h3>
        {mostGuilty ? (
          <div className="mt-6 grid items-center gap-6 sm:grid-cols-[12rem_1fr]">
            <CatImage
              cat={mostGuilty.cat}
              className="mx-auto aspect-square w-48 -rotate-3 rounded-3xl border-4 border-accent"
            />
            <div className="text-center sm:text-left">
              <p className="font-display text-4xl font-bold">{mostGuilty.cat.name}</p>
              <p className="mt-1 text-muted-foreground">{mostGuilty.cat.crime}</p>
              <p className="mt-3 inline-block rounded-full bg-guilty px-4 py-1 font-display font-semibold text-guilty-foreground">
                {plural(mostGuilty.guilty, "voto de culpado", "votos de culpado")}
              </p>
            </div>
          </div>
        ) : (
          <p className="mt-4 text-center text-lg text-muted-foreground">
            Ninguém votou culpado. Que turma boazinha!
          </p>
        )}
      </div>

      <div>
        <h3 className="flex items-center justify-center gap-2 font-display text-2xl font-bold">
          <Moon className="size-6 text-primary" strokeWidth={2.5} />
          Prisão da Soneca
        </h3>
        {prison.length === 0 ? (
          <p className="mt-4 text-center text-lg text-muted-foreground">
            A prisão está vazia. Todos os gatos foram soltos!
          </p>
        ) : (
          <ul aria-label="Gatos condenados" className="mt-6 flex flex-wrap justify-center gap-5">
            {prison.map((cat, index) => (
              <li key={`${index}-${cat.name}`} className="w-[calc(50%-0.75rem)] text-center motion-safe:animate-pop sm:w-48">
                <CatImage cat={cat} jailed className="aspect-square w-full rounded-3xl border-4 border-card shadow-lg" />
                <p className="mt-2 font-display text-lg font-semibold">{cat.name}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
