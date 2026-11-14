import type { Metadata } from "next";
import { PageShell } from "@/components/page-shell";
import { normalizeRoomCode } from "@/lib/api";
import { JoinRoomForm } from "./join-room-form";

export const metadata: Metadata = { title: "Entrar" };

// Chega aqui pelo formulário da landing ou pelo QR code: /entrar?codigo=XXXXXX
export default async function EntrarPage({ searchParams }: PageProps<"/entrar">) {
  const { codigo } = await searchParams;
  const initialCode = typeof codigo === "string" ? normalizeRoomCode(codigo) : "";

  return (
    <PageShell>
      <main className="relative mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-8 px-5 pb-16 motion-safe:animate-rise">
        <div>
          <h1 className="font-display text-5xl font-bold leading-tight">Entrar no tribunal</h1>
          <p className="mt-3 text-lg text-muted-foreground">Só precisa do código da sala e do seu nome. Sem cadastro!</p>
        </div>
        <JoinRoomForm initialCode={initialCode} />
      </main>
    </PageShell>
  );
}
