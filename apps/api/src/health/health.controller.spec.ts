import { Test } from "@nestjs/testing";
import { describe, expect, it } from "vitest";
import { HealthController } from "./health.controller.js";

describe("HealthController", () => {
  it("responde que a API está de pé", async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [HealthController],
    }).compile();

    const controller = moduleRef.get(HealthController);

    expect(controller.check()).toEqual({ status: "ok" });
  });
});
