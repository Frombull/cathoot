"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, errorMessage, normalizeRoomCode } from "@/lib/api";
import { saveParticipant, useParticipant } from "@/lib/storage";

const fieldClass = "h-12 rounded-2xl px-4 text-lg md:text-lg";

export function JoinRoomForm({ initialCode }: { initialCode: string }) {
  const router = useRouter();
  const [code, setCode] = useState(initialCode);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Quem já entrou nesta sala por este navegador (escaneou o QR de novo, por exemplo)
  const returning = useParticipant(initialCode);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const room = normalizeRoomCode(code);
    setBusy(true);
    setError(null);
    try {
      const participant = await api.join(room, name);
      saveParticipant(room, participant);
      router.push(`/sala/${room}`);
    } catch (caught) {
      setError(errorMessage(caught));
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {initialCode && returning && (
        <div className="flex flex-col items-start gap-3 rounded-3xl border-2 border-dashed bg-card p-5">
          <p className="text-lg">
            Você já está nessa sala como <strong className="font-display">{returning.name}</strong>.
          </p>
          <Button asChild variant="accent" size="xl">
            <Link href={`/sala/${initialCode}`}>
              Voltar para a sala
              <ArrowRight strokeWidth={2.5} />
            </Link>
          </Button>
        </div>
      )}

      <form onSubmit={onSubmit} className="flex flex-col gap-5 rounded-4xl border-2 bg-card p-6 shadow-xl shadow-primary/15 sm:p-8">
        <div className="flex flex-col gap-2">
          <Label htmlFor="codigo" className="font-display text-lg font-semibold">
            Código da sala
          </Label>
          <Input
            id="codigo"
            name="codigo"
            required
            maxLength={6}
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            autoFocus={!initialCode}
            value={code}
            onChange={(event) => setCode(event.target.value)}
            className={`${fieldClass} font-display font-semibold uppercase tracking-widest`}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="nome" className="font-display text-lg font-semibold">
            Seu nome
          </Label>
          <Input
            id="nome"
            name="nome"
            required
            maxLength={24}
            autoComplete="nickname"
            autoFocus={Boolean(initialCode)}
            placeholder="Como a turma te conhece"
            value={name}
            onChange={(event) => setName(event.target.value)}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? "entrar-erro" : undefined}
            className={fieldClass}
          />
        </div>
        {error && (
          <p id="entrar-erro" role="alert" className="font-semibold text-destructive">
            {error}
          </p>
        )}
        <Button type="submit" size="xl" disabled={busy} className="shadow-lg shadow-primary/30">
          {busy ? "Entrando..." : "Entrar no tribunal"}
          <ArrowRight strokeWidth={2.5} />
        </Button>
      </form>
    </div>
  );
}
