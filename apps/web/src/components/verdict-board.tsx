import { CatImage } from "@/components/cat-image";
import type { Cat, SessionView } from "@/lib/api";
import { percent, plural } from "@/lib/text";
import { cn } from "@/lib/utils";

type Result = NonNullable<SessionView["result"]>;

function verdictLine(cat: Cat, { guilty, innocent, verdict }: Result) {
  if (verdict === "CULPADO") return `${cat.name} vai para a Prisão da Soneca.`;
  if (guilty + innocent === 0) return "Ninguém votou. Na dúvida, solta o gato!";
  if (guilty === innocent) return "Empate! Na dúvida, solta o gato.";
  return `${cat.name} está livre para novas travessuras.`;
}

function ScoreBar({ label, votes, total, className }: { label: string; votes: number; total: number; className: string }) {
  return (
    <div>
      <div className="flex items-baseline justify-between font-display text-lg font-semibold">
        <dt>{label}</dt>
        <dd>{plural(votes, "voto", "votos")}</dd>
      </div>
      <div className="mt-1 h-4 overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full transition-[width] duration-700 ease-out", className)}
          style={{ width: `${percent(votes, total)}%` }}
        />
      </div>
    </div>
  );
}

// Carimbo do veredito por cima da foto e o placar da turma
export function VerdictBoard({ cat, result }: { cat: Cat; result: Result }) {
  const guilty = result.verdict === "CULPADO";
  const total = result.guilty + result.innocent;

  return (
    <section className="flex flex-col items-center gap-12 text-center">
      <div className="relative w-full max-w-xs sm:max-w-sm">
        <CatImage
          cat={cat}
          jailed={guilty}
          className="aspect-square w-full rounded-4xl border-4 border-card shadow-2xl shadow-primary/25"
        />
        <p
          role="status"
          className={cn(
            "absolute -bottom-7 left-1/2 -translate-x-1/2 -rotate-6 whitespace-nowrap rounded-2xl border-4 border-card px-6 py-2 font-display text-4xl font-bold uppercase shadow-xl motion-safe:animate-stamp sm:text-5xl",
            guilty ? "bg-guilty text-guilty-foreground" : "bg-innocent text-innocent-foreground",
          )}
        >
          {guilty ? "Culpado!" : "Inocente!"}
        </p>
      </div>

      <div className="w-full max-w-md">
        <h2 className="font-display text-3xl font-bold">{cat.name}</h2>
        <p className="mt-1 text-lg text-muted-foreground">{verdictLine(cat, result)}</p>
        <dl className="mt-6 grid gap-4 text-left">
          <ScoreBar label="Culpado" votes={result.guilty} total={total} className="bg-guilty" />
          <ScoreBar label="Inocente" votes={result.innocent} total={total} className="bg-innocent" />
        </dl>
      </div>
    </section>
  );
}
