"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Gavel } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, errorMessage } from "@/lib/api";
import { savePresenterToken } from "@/lib/storage";

export function CreateRoomForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const { code, presenterToken } = await api.createSession(password);
      // O token autoriza "Próximo" e "Revelar" nesta sala, só neste navegador
      savePresenterToken(code, presenterToken);
      router.push(`/sala/${code}/apresentador`);
    } catch (caught) {
      setError(errorMessage(caught));
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5 rounded-4xl border-2 bg-card p-6 shadow-xl shadow-primary/15 sm:p-8">
      <div className="flex flex-col gap-2">
        <Label htmlFor="senha" className="font-display text-lg font-semibold">
          Senha do apresentador
        </Label>
        <Input
          id="senha"
          type="password"
          required
          autoFocus
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "senha-erro" : undefined}
          className="h-12 rounded-2xl px-4 text-lg md:text-lg"
        />
        {error && (
          <p id="senha-erro" role="alert" className="font-semibold text-destructive">
            {error}
          </p>
        )}
      </div>
      <Button type="submit" size="xl" disabled={busy} className="shadow-lg shadow-primary/30">
        <Gavel strokeWidth={2.5} />
        {busy ? "Abrindo o tribunal..." : "Abrir o tribunal"}
      </Button>
    </form>
  );
}
