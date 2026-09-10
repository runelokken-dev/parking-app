import { PrismaClient } from "@prisma/client";

// Unngår at det opprettes en ny PrismaClient for hver hot-reload i utvikling.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
