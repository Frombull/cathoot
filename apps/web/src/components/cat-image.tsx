import type { Cat } from "@/lib/api";
import { cn } from "@/lib/utils";

// A imagem vem da API (/cats/1.jpg, repassada pelo Next) ou de uma URL externa,
// então é um <img> simples, sem passar pelo otimizador do next/image.
// "jailed" põe as grades da Prisão da Soneca por cima.
export function CatImage({ cat, jailed = false, className }: { cat: Cat; jailed?: boolean; className?: string }) {
  return (
    <div className={cn("relative overflow-hidden bg-muted", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={cat.imageUrl} alt={`Foto do gato ${cat.name}`} className="size-full object-cover" />
      {jailed && (
        <div
          aria-hidden
          className="absolute inset-0 bg-[repeating-linear-gradient(90deg,transparent_0_26px,rgb(26_21_56/0.85)_26px_34px)]"
        />
      )}
    </div>
  );
}
