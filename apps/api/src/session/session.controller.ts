import { Body, Controller, Get, Header, Headers, HttpCode, Inject, Param, Post, Query } from "@nestjs/common";
import { DomainError } from "./errors.js";
import { SessionService } from "./session-service.js";

function text(body: unknown, field: string) {
  const value = (body as Record<string, unknown> | undefined)?.[field];
  if (typeof value !== "string") throw new DomainError("REQUEST_INVALID", `Campo "${field}" é obrigatório`);
  return value;
}

@Controller("sessions")
export class SessionController {
  constructor(@Inject(SessionService) private readonly sessions: SessionService) {}

  @Post()
  create(@Body() body: unknown) {
    return this.sessions.create(text(body, "password"));
  }

  // O front consulta isto a cada ~1,5 s: nada de cache
  @Get(":code")
  @Header("Cache-Control", "no-store")
  view(@Param("code") code: string, @Query("participantId") participantId?: string) {
    return this.sessions.view(code, participantId);
  }

  @Post(":code/participants")
  join(@Param("code") code: string, @Body() body: unknown) {
    return this.sessions.join(code, text(body, "name"));
  }

  @Post(":code/votes")
  @HttpCode(204)
  async vote(@Param("code") code: string, @Body() body: unknown) {
    await this.sessions.vote(code, text(body, "participantId"), text(body, "choice"));
  }

  @Post(":code/start")
  @HttpCode(200)
  async start(@Param("code") code: string, @Headers("x-presenter-token") token?: string) {
    await this.sessions.start(code, token);
    return this.sessions.view(code);
  }

  @Post(":code/reveal")
  @HttpCode(200)
  async reveal(@Param("code") code: string, @Headers("x-presenter-token") token?: string) {
    await this.sessions.reveal(code, token);
    return this.sessions.view(code);
  }

  @Post(":code/next")
  @HttpCode(200)
  async next(@Param("code") code: string, @Headers("x-presenter-token") token?: string) {
    await this.sessions.next(code, token);
    return this.sessions.view(code);
  }
}
