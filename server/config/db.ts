import { PrismaClient } from "@prisma/client";
import { requireEnv } from "./env";

declare global {
  var prismaClient: PrismaClient | undefined;
}

export function getPrisma() {
  const databaseUrl = requireEnv("databaseUrl");
  if (databaseUrl.includes("<") || databaseUrl.includes(">")) {
    throw new Error("DATABASE_URL still contains a placeholder value.");
  }

  if (!global.prismaClient) {
    global.prismaClient = new PrismaClient({
      datasources: {
        db: {
          url: databaseUrl
        }
      }
    });
  }

  return global.prismaClient;
}
