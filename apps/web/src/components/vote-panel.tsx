import { CircleCheck, Gavel, HeartHandshake } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { VoteChoice } from "@/lib/api";
import { cn } from "@/lib/utils";

export const VOTE_LABEL: Record<VoteChoice, string> = { CULPADO: "Culpado", INOCENTE: "Inocente" };

interface VotePanelProps {
  hasVoted: boolean;
  // O lado escolhido só é conhecido no navegador que votou (a API não conta)
  myChoice?: VoteChoice;
  busy?: boolean;
  error?: string | null;
  onVote: (choice: VoteChoice) => void;
}

// Os dois botões gigantes do aluno; depois do voto, só a confirmação (o voto não muda)
export function VotePanel({ hasVoted, myChoice, busy = false, error, onVote }: VotePanelProps) {
  if (hasVoted) {
    return (
      <div
        role="status"
        className="flex flex-col items-center gap-2 rounded-3xl border-2 bg-card p-6 text-center motion-safe:animate-pop"
      >
        <CircleCheck className="size-10 text-innocent" strokeWidth={2.5} />
        <p className="font-display text-2xl font-bold">Voto registrado!</p>
        {myChoice && (
          <p className="text-lg">
            Você votou{" "}
            <strong className={cn("font-display", myChoice === "CULPADO" ? "text-guilty" : "text-innocent")}>
              {VOTE_LABEL[myChoice]}
            </strong>
            .
          </p>
        )}
        <p className="text-muted-foreground">Esperando o juiz revelar o veredito...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-3">
        <Button
          variant="guilty"
          size="xl"
          disabled={busy}
          onClick={() => onVote("CULPADO")}
          className="h-28 flex-col rounded-3xl text-2xl shadow-lg shadow-guilty/30 hover:-rotate-2 [&_svg:not([class*='size-'])]:size-9"
        >
          <Gavel strokeWidth={2.5} />
          Culpado
        </Button>
        <Button
          variant="innocent"
          size="xl"
          disabled={busy}
          onClick={() => onVote("INOCENTE")}
          className="h-28 flex-col rounded-3xl text-2xl shadow-lg shadow-innocent/30 hover:rotate-2 [&_svg:not([class*='size-'])]:size-9"
        >
          <HeartHandshake strokeWidth={2.5} />
          Inocente
        </Button>
      </div>
      {error && (
        <p role="alert" className="mt-3 text-center font-semibold text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
