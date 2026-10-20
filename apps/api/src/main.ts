import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module.js";

const app = await NestFactory.create(AppModule);
await app.listen(process.env.API_PORT ?? 3001, "0.0.0.0");
