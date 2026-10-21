import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

// Fundo preto fixo nos dois temas, para a foto (que tem fundo preto) se fundir com a página.
// O html/body também ficam pretos, senão o overscroll da rolagem mostra o fundo do tema.
export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-black px-5 py-10 text-center text-white motion-safe:animate-rise">
      <style>{"html,body{background:#000}"}</style>
      <Image
        src="/gato-404.jpg"
        alt="Um gato escondido debaixo de uns papéis, só o rabo aparece. Legenda: 404 Not Found"
        width={750}
        height={600}
        preload
        sizes="(min-width: 768px) 750px, 100vw"
        className="h-auto max-h-[55dvh] w-full max-w-187.5 object-contain"
      />

      <h1 className="font-display text-3xl font-bold sm:text-4xl">Esse gato se escondeu.</h1>

      <Link
        href="/"
        className="inline-flex items-center gap-2 rounded-full bg-primary px-8 py-4 font-display text-xl font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition hover:-rotate-2 hover:scale-105"
      >
        <ArrowLeft className="size-5" />
        Voltar para o início
      </Link>
    </main>
  );
}
