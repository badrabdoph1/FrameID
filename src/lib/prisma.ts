import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });
}

let _prisma: PrismaClient | undefined;

function getPrisma(): PrismaClient {
  if (!_prisma) {
    _prisma = globalForPrisma.prisma ?? createPrismaClient();
    if (process.env.NODE_ENV !== "production") {
      globalForPrisma.prisma = _prisma;
    }
  }
  return _prisma;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    return Reflect.get(getPrisma(), prop, receiver);
  },
});
