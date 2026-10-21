import { Catch, type ArgumentsHost, type ExceptionFilter } from "@nestjs/common";
import type { Response } from "express";
import { DomainError } from "../session/errors.js";

const STATUS_BY_CODE: Record<string, number> = {
  PRESENTER_UNAUTHORIZED: 401,
  SESSION_NOT_FOUND: 404,
  PARTICIPANT_NOT_FOUND: 404,
  // O pedido é válido, mas o estado atual da sala não permite
  PARTICIPANT_NAME_TAKEN: 409,
  ALREADY_VOTED: 409,
  VOTING_CLOSED: 409,
  INVALID_STATE_TRANSITION: 409,
  SESSION_NOT_IN_LOBBY: 409,
  SESSION_FINISHED: 409,
  SESSION_HAS_NO_CATS: 409,
  SESSION_NOT_FINISHED: 409,
  ROOM_CODE_EXHAUSTED: 503,
};

// Qualquer outro erro de domínio (campo vazio, voto inválido...) é pedido malformado
export const statusFor = (code: string) => STATUS_BY_CODE[code] ?? 400;

@Catch(DomainError)
export class DomainErrorFilter implements ExceptionFilter {
  catch(error: DomainError, host: ArgumentsHost) {
    host
      .switchToHttp()
      .getResponse<Response>()
      .status(statusFor(error.code))
      .json({ code: error.code, message: error.message });
  }
}
