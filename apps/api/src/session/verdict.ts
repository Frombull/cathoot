export type VoteChoice = "CULPADO" | "INOCENTE";
export type Verdict = VoteChoice;

export interface Tally {
  guilty: number;
  innocent: number;
}

export function tally(choices: VoteChoice[]): Tally {
  const guilty = choices.filter((c) => c === "CULPADO").length;
  return { guilty, innocent: choices.length - guilty };
}

// Na dúvida, solta o gato: empate e zero votos absolvem
export function computeVerdict({ guilty, innocent }: Tally): Verdict {
  return guilty > innocent ? "CULPADO" : "INOCENTE";
}
