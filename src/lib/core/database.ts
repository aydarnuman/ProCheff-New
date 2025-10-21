/**
 * ProCheff Database Connection
 * Prisma ORM singleton instance
 */

import { PrismaClient } from "../../generated/prisma";

declare global {
  var __prisma: PrismaClient | undefined;
}

// Singleton pattern for Prisma Client
let prisma: PrismaClient;

if (process.env.NODE_ENV === "production") {
  prisma = new PrismaClient();
} else {
  if (!global.__prisma) {
    global.__prisma = new PrismaClient({
      log: ["query", "info", "warn", "error"],
    });
  }
  prisma = global.__prisma;
}

export { prisma };

// Type exports for TypeScript
export type {
  User,
  Restaurant,
  Menu,
  MenuItem,
  MenuAnalysis,
  Offer,
  OfferItem,
  Tender,
  TenderBid,
  ApiKey,
  Session,
} from "../../generated/prisma";
