import { PrismaClient } from "@prisma/client";

// Singleton pattern to prevent multiple Prisma instances in development
// Next.js hot reloading can create multiple instances without this pattern

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const db = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}

export default db;
