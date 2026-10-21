import { DomainError } from "./errors.js";

// Sem 0/O e 1/I, que se confundem na hora de digitar
export const ROOM_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const ROOM_CODE_LENGTH = 6;
const MAX_ATTEMPTS = 10;

export function generateRoomCode(isTaken: (code: string) => boolean, random: () => number = Math.random) {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    let code = "";
    for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
      code += ROOM_CODE_ALPHABET[Math.floor(random() * ROOM_CODE_ALPHABET.length)];
    }
    if (!isTaken(code)) return code;
  }
  throw new DomainError("ROOM_CODE_EXHAUSTED", "Não foi possível gerar um código de sala livre");
}

export function normalizeRoomCode(code: string) {
  return code.trim().toUpperCase();
}
