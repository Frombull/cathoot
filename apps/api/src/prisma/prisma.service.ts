import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";

// O módulo registra esta classe com uma factory que lê o DATABASE_URL
export class PrismaService extends PrismaClient {
  constructor(connectionString: string) {
    super({ adapter: new PrismaPg({ connectionString }) });
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
