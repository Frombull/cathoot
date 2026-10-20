import { describe, expect, it } from "vitest";
import { DomainError } from "./errors.js";
import { generateRoomCode, normalizeRoomCode, ROOM_CODE_ALPHABET } from "./room-code.js";

describe("ROOM_CODE_ALPHABET", () => {
  it("não tem caracteres que se confundem nem minúsculas", () => {
    for (const c of ["0", "O", "1", "I"]) expect(ROOM_CODE_ALPHABET).not.toContain(c);
    expect(ROOM_CODE_ALPHABET).toBe(ROOM_CODE_ALPHABET.toUpperCase());
  });
});

describe("generateRoomCode", () => {
  it("gera 6 caracteres do alfabeto", () => {
    const code = generateRoomCode(() => false);

    expect(code).toHaveLength(6);
    for (const c of code) expect(ROOM_CODE_ALPHABET).toContain(c);
  });

  it("usa a fonte de aleatoriedade informada", () => {
    expect(generateRoomCode(() => false, () => 0)).toBe(ROOM_CODE_ALPHABET[0].repeat(6));
  });

  it("gera outro código quando o primeiro já está em uso", () => {
    const sorteios = [0, 0.5];
    let i = 0;
    const random = () => sorteios[i++ % sorteios.length];
    const primeiro = ROOM_CODE_ALPHABET[0].repeat(6);

    const code = generateRoomCode((c) => c === primeiro, random);

    expect(code).not.toBe(primeiro);
    expect(code).toHaveLength(6);
  });

  it("desiste quando todas as tentativas já estão em uso", () => {
    expect(() => generateRoomCode(() => true)).toThrowError(
      expect.objectContaining({ code: "ROOM_CODE_EXHAUSTED" }),
    );
    expect(() => generateRoomCode(() => true)).toThrow(DomainError);
  });
});

describe("normalizeRoomCode", () => {
  it("coloca em maiúsculas e tira espaços", () => {
    expect(normalizeRoomCode("  ab3kx9 ")).toBe("AB3KX9");
  });
});
