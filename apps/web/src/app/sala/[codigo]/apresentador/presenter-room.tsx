"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Eye, Gavel, Plus, Trophy } from "lucide-react";
import { CatCard } from "@/components/cat-card";
import { FinalSummary } from "@/components/final-summary";
import { JoinQr } from "@/components/join-qr";
import { PageShell, RoomBadge } from "@/components/page-shell";
import { Loading, RoomMessage } from "@/components/room-status";
import { Button } from "@/components/ui/button";
import { VerdictBoard } from "@/components/verdict-board";
import { useSessionView } from "@/hooks/use-session-view";
import { api, errorCode, errorMessage } from "@/lib/api";
import { usePresenterToken } from "@/lib/storage";
import { percent, plural } from "@/lib/text";

type Action = "start" | "reveal" | "next";

// O telão: QR code no lobby, o gato da vez, o veredito e o resumo. Os botões só aparecem
// no navegador que criou a sala (que tem o token); em outro, a tela é só para assistir.
export function PresenterRoom({ code }: { code: string }) {
  const token = usePresenterToken(code);
  const { view, error, apply, refresh } = useSessionView(code);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  async function run(action: Action) {
    if (!token) return;
    setBusy(true);
    setActionError(null);
    try {
      apply(await api[action](code, token));
    } catch (caught) {
      // Clique duplo ou outra aba já avançou: só atualiza a tela
      if (errorCode(caught) === "INVALID_STATE_TRANSITION") refresh();
      else setActionError(errorMessage(caught));
    } finally {
      setBusy(false);
    }
  }

  function actionButton(action: Action, label: string, icon: React.ReactNode, variant: "default" | "accent" = "default") {
    if (!token) return null;
    return (
      <Button
        size="xl"
        variant={variant}
        disabled={busy}
        onClick={() => run(action)}
        className="shadow-lg shadow-primary/30 hover:-rotate-2 hover:scale-105"
      >
        {label}
        {icon}
      </Button>
    );
  }

  function content() {
    if (error?.code === "SESSION_NOT_FOUND") {
      return (
        <RoomMessage
          title="Sala não encontrada"
          action={
            <Button asChild size="xl">
              <Link href="/criar">Criar outra sala</Link>
            </Button>
          }
        >
          Essa sala não existe (ou o banco foi zerado).
        </RoomMessage>
      );
    }
    if (!view) return <Loading />;

    switch (view.state) {
      case "LOBBY":
        return (
          <div className="grid flex-1 gap-10 py-6 lg:grid-cols-[auto_1fr] lg:items-start lg:gap-16">
            <JoinQr code={code} />
            <section className="flex flex-col gap-6">
              <div>
                <h1 className="font-display text-5xl font-bold">Quem vai julgar?</h1>
                <p className="mt-2 text-xl text-muted-foreground">
                  {plural(view.participants.length, "pessoa no tribunal", "pessoas no tribunal")} ·{" "}
                  {plural(view.totalCats, "gato no banco dos réus", "gatos no banco dos réus")}
                </p>
              </div>
              {view.participants.length === 0 ? (
                <p className="rounded-3xl border-2 border-dashed p-6 text-center text-lg text-muted-foreground">
                  Esperando a turma escanear o QR code...
                </p>
              ) : (
                <ul aria-label="Participantes" className="flex flex-wrap gap-2">
                  {view.participants.map((name) => (
                    <li
                      key={name}
                      className="rounded-full border-2 bg-card px-4 py-1.5 font-display text-lg font-semibold motion-safe:animate-pop"
                    >
                      {name}
                    </li>
                  ))}
                </ul>
              )}
              <div>{actionButton("start", "Começar julgamento", <Gavel strokeWidth={2.5} />)}</div>
            </section>
          </div>
        );

      case "VOTANDO":
        return (
          <div className="flex flex-col gap-8 py-6">
            {view.cat && view.catNumber && <CatCard cat={view.cat} number={view.catNumber} total={view.totalCats} />}
            <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div className="w-full max-w-md">
                <p className="font-display text-2xl font-semibold">
                  {view.votesReceived} de {plural(view.participants.length, "pessoa votou", "pessoas votaram")}
                </p>
                <div className="mt-2 h-4 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-[width] duration-500 ease-out"
                    style={{ width: `${percent(view.votesReceived, view.participants.length)}%` }}
                  />
                </div>
              </div>
              {actionButton("reveal", "Revelar veredito", <Eye strokeWidth={2.5} />, "accent")}
            </div>
          </div>
        );

      case "RESULTADO": {
        const last = view.catNumber === view.totalCats;
        return (
          <div className="flex flex-col items-center gap-10 py-6">
            {view.cat && view.result && <VerdictBoard cat={view.cat} result={view.result} />}
            {last
              ? actionButton("next", "Ver resumo final", <Trophy strokeWidth={2.5} />)
              : actionButton("next", "Próximo gato", <ArrowRight strokeWidth={2.5} />)}
          </div>
        );
      }

      case "FIM":
        return (
          <div className="flex flex-col items-center gap-10 py-6">
            {view.summary && <FinalSummary summary={view.summary} totalCats={view.totalCats} />}
            <Button asChild size="xl" variant="accent">
              <Link href="/criar">
                <Plus strokeWidth={3} />
                Novo julgamento
              </Link>
            </Button>
          </div>
        );
    }
  }

  return (
    <PageShell nav={<RoomBadge code={code} />}>
      <main className="relative mx-auto flex w-full max-w-6xl flex-1 flex-col px-5 pb-16 sm:px-8">
        {token === null && view && (
          <p className="mx-auto mb-2 rounded-full bg-muted px-4 py-1.5 text-center text-sm text-muted-foreground">
            Modo telão: só o navegador que criou a sala pode avançar o julgamento.
          </p>
        )}
        {content()}
        {actionError && (
          <p role="alert" className="mt-4 text-center font-semibold text-destructive">
            {actionError}
          </p>
        )}
        {error && view && error.code !== "SESSION_NOT_FOUND" && (
          <p role="status" className="mt-4 text-center text-sm text-muted-foreground">
            Conexão instável, tentando de novo...
          </p>
        )}
      </main>
    </PageShell>
  );
}
