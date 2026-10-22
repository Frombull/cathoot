import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Gavel, PawPrint, Plus, Users } from "lucide-react";
import { PageShell } from "@/components/page-shell";

const destaques = [
  { icon: PawPrint, titulo: "Casos reais", detalhe: "(e alguns nem tanto)" },
  { icon: Gavel, titulo: "Decida o destino", detalhe: "dos gatos" },
  { icon: Users, titulo: "Jogue com a turma", detalhe: "toda de uma vez" },
];

export default function Home() {
  return (
    <PageShell
      nav={
        <a
          href="#como-jogar"
          className="hidden px-3 font-display text-lg font-medium text-foreground/80 transition hover:text-foreground sm:block"
        >
          Como jogar
        </a>
      }
    >

      <main className="relative mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center gap-12 px-5 pb-16 pt-8 sm:px-8 md:grid md:grid-cols-2 md:items-center md:gap-8 md:py-12">
        <section className="motion-safe:animate-rise">
          <p className="mb-4 inline-block rounded-full bg-accent px-4 py-1 font-display text-sm font-semibold text-accent-foreground">
            O kahoot de tribunal de crime de gatos!
          </p>
          <h1 className="font-display text-5xl font-bold leading-[1.05] sm:text-6xl lg:text-7xl">
            Teste seu conhecimento.{" "}
            <span className="text-primary">Julgue gatos.</span>
          </h1>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-muted-foreground">
            Em Cathoot, você é o juiz. Veja os casos, analise as provas e decida
            o destino dos nossos (nem tão) inocentes felinos.
          </p>
          <div className="mt-8 flex flex-col items-start gap-4">
            <Link
              href="/criar"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-8 py-4 font-display text-xl font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition hover:-rotate-2 hover:scale-105"
            >
              <Plus className="size-6" strokeWidth={3} />
              Criar sala
            </Link>

            <div className="flex items-center gap-4">
              <span className="font-display text-lg text-muted-foreground">ou</span>

              {/* Sem JS também funciona: vai para /entrar?codigo=XXXXXX (o QR code leva ao mesmo endereço) */}
              <form
                action="/entrar"
                className="flex items-center rounded-full border-2 border-border bg-card p-1.5 transition focus-within:border-primary"
              >
                <input
                  name="codigo"
                  required
                  maxLength={6}
                  autoComplete="off"
                  autoCapitalize="characters"
                  spellCheck={false}
                  aria-label="Código da sala"
                  placeholder="Código da sala"
                  className="w-40 bg-transparent px-4 font-display text-lg font-semibold uppercase tracking-widest text-foreground outline-none placeholder:font-medium placeholder:normal-case placeholder:tracking-normal placeholder:text-muted-foreground"
                />
                <button
                  type="submit"
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-accent px-5 py-2.5 font-display text-lg font-semibold text-accent-foreground transition hover:scale-105"
                >
                  Entrar
                  <ArrowRight className="size-5" strokeWidth={2.5} />
                </button>
              </form>
            </div>
          </div>

          <ul id="como-jogar" className="mt-12 flex flex-wrap gap-x-6 gap-y-5">
            {destaques.map(({ icon: Icon, titulo, detalhe }) => (
              <li key={titulo} className="flex items-center gap-3">
                <Icon className="size-7 text-accent" strokeWidth={2.2} />
                <span className="text-sm leading-tight text-muted-foreground">
                  <strong className="block font-display text-base font-semibold text-foreground">
                    {titulo}
                  </strong>
                  {detalhe}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="relative mx-auto w-full max-w-md md:max-w-none motion-safe:animate-rise [animation-delay:150ms]">
          <div className="overflow-hidden rounded-4xl border-4 border-card shadow-2xl shadow-primary/25">
            <Image
              src="/hero-juiz.jpg"
              alt="Um gato juiz de toga, bravo, segurando um martelo atrás do balcão do tribunal"
              width={480}
              height={390}
              preload
              sizes="(min-width: 768px) 520px, 90vw"
              className="h-auto w-full"
            />
          </div>
          <span className="absolute -bottom-5 -left-3 -rotate-6 rounded-2xl bg-accent px-5 py-2 font-display text-2xl font-bold text-accent-foreground shadow-lg motion-safe:animate-bob">
            Culpado?
          </span>
        </section>
      </main>
    </PageShell>
  );
}
