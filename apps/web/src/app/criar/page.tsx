import type { Metadata } from "next";
import { PageShell } from "@/components/page-shell";
import { CreateRoomForm } from "./create-room-form";

export const metadata: Metadata = { title: "Criar sala" };

export default function CriarPage() {
  return (
    <PageShell>
      <main className="relative mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-8 px-5 pb-16 motion-safe:animate-rise">
        <div>
          <p className="mb-3 inline-block -rotate-2 rounded-full bg-accent px-4 py-1 font-display text-sm font-semibold text-accent-foreground">
            Só para o juiz
          </p>
          <h1 className="font-display text-5xl font-bold leading-tight">Abrir o tribunal</h1>
          <p className="mt-3 text-lg text-muted-foreground">
            Digite a senha do apresentador para criar a sala. Depois é só mostrar o QR code para a turma.
          </p>
        </div>
        <CreateRoomForm />
      </main>
    </PageShell>
  );
}
