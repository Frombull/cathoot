"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PawPrint } from "lucide-react";
import { CatCard } from "@/components/cat-card";
import { FinalSummary } from "@/components/final-summary";
import { PageShell, RoomBadge } from "@/components/page-shell";
import { Loading, RoomMessage } from "@/components/room-status";
import { Button } from "@/components/ui/button";
import { VerdictBoard } from "@/components/verdict-board";
import { VOTE_LABEL, VotePanel } from "@/components/vote-panel";
import { useSessionView } from "@/hooks/use-session-view";
import { api, errorCode, errorMessage, type VoteChoice } from "@/lib/api";
import { forgetParticipant, useParticipant } from "@/lib/storage";
import { plural } from "@/lib/text";

// O que o aluno vê no celular: lobby, voto, veredito e resumo, conforme o apresentador avança
export function StudentRoom({ code }: { code: string }) {
  const router = useRouter();
  const participant = useParticipant(code);
  const { view, error, refresh } = useSessionView(code, participant?.participantId, Boolean(participant));
  const [voting, setVoting] = useState(false);
  const [voteError, setVoteError] = useState<string | null>(null);
  // Guardado por gato, então some sozinho quando o próximo gato entra
  const [myVote, setMyVote] = useState<{ catNumber: number; choice: VoteChoice } | null>(null);

  // Sem nome nesta sala (ou a sala esqueceu o participante): vai para o formulário de entrada
  useEffect(() => {
    if (participant === null) router.replace(`/entrar?codigo=${code}`);
  }, [participant, code, router]);

  useEffect(() => {
    if (error?.code === "PARTICIPANT_NOT_FOUND") forgetParticipant(code);
  }, [error, code]);

  const myChoice = myVote && myVote.catNumber === view?.catNumber ? myVote.choice : undefined;

  async function vote(choice: VoteChoice) {
    if (!participant || !view?.catNumber) return;
    const catNumber = view.catNumber;
    setVoting(true);
    setVoteError(null);
    try {
      await api.vote(code, participant.participantId, choice);
      setMyVote({ catNumber, choice });
    } catch (caught) {
      // Já votou ou a votação fechou: a próxima consulta mostra a tela certa
      const ignorable = ["ALREADY_VOTED", "VOTING_CLOSED"].includes(errorCode(caught));
      if (!ignorable) setVoteError(errorMessage(caught));
    } finally {
      setVoting(false);
      refresh();
    }
  }

  function content() {
    if (error?.code === "SESSION_NOT_FOUND") {
      return (
        <RoomMessage
          title="Sala não encontrada"
          action={
            <Button asChild size="xl">
              <Link href="/">Voltar para o início</Link>
            </Button>
          }
        >
          Essa sala não existe (ou já foi fechada). Confere o código com o apresentador.
        </RoomMessage>
      );
    }
    if (!participant || !view) return <Loading />;

    switch (view.state) {
      case "LOBBY":
        return (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 py-10 text-center motion-safe:animate-rise">
            <PawPrint className="size-16 text-accent motion-safe:animate-bob" strokeWidth={2.5} />
            <h1 className="font-display text-4xl font-bold">Você está no tribunal, {participant.name}!</h1>
            <p className="text-lg text-muted-foreground">Esperando o juiz começar o julgamento...</p>
            <p className="rounded-full bg-card px-4 py-1 font-display font-semibold">
              {plural(view.participants.length, "pessoa na sala", "pessoas na sala")}
            </p>
          </div>
        );

      case "VOTANDO":
        return (
          <div className="flex flex-col gap-6 py-4">
            {view.cat && view.catNumber && <CatCard cat={view.cat} number={view.catNumber} total={view.totalCats} />}
            <VotePanel
              hasVoted={Boolean(view.hasVoted) || Boolean(myChoice)}
              myChoice={myChoice}
              busy={voting}
              error={voteError}
              onVote={vote}
            />
          </div>
        );

      case "RESULTADO":
        return (
          <div className="flex flex-col gap-6 py-4">
            {view.cat && view.result && <VerdictBoard cat={view.cat} result={view.result} />}
            {myChoice && view.result && (
              <p className="text-center text-lg">
                Você votou <strong className="font-display">{VOTE_LABEL[myChoice]}</strong>.{" "}
                {myChoice === view.result.verdict ? "A turma concordou com você!" : "Dessa vez a turma pensou diferente."}
              </p>
            )}
          </div>
        );

      case "FIM":
        return (
          <div className="flex flex-col gap-8 py-4">
            {view.summary && <FinalSummary summary={view.summary} totalCats={view.totalCats} />}
            <p className="text-center text-lg text-muted-foreground">Obrigado por julgar, {participant.name}!</p>
          </div>
        );
    }
  }

  return (
    <PageShell nav={<RoomBadge code={code} />}>
      <main className="relative mx-auto flex w-full max-w-md flex-1 flex-col px-5 pb-12 lg:max-w-2xl">
        {content()}
        {error && view && error.code !== "SESSION_NOT_FOUND" && (
          <p role="status" className="mt-4 text-center text-sm text-muted-foreground">
            Conexão instável, tentando de novo...
          </p>
        )}
      </main>
    </PageShell>
  );
}
