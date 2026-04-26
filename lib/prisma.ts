import { PrismaClient } from "@prisma/client";
import { PrismaD1 } from "@prisma/adapter-d1";

// For local dev (next dev), fall back to the file-based SQLite client
const isCloudflare =
  typeof globalThis !== "undefined" &&
  (globalThis as any).__cf_env !== undefined;

let _localPrisma: PrismaClient | undefined;

/** Get a PrismaClient backed by the local SQLite file (next dev only). */
function getLocalPrisma(): PrismaClient {
  if (!_localPrisma) {
    _localPrisma = new PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    });
  }
  return _localPrisma;
}

/** Get a PrismaClient backed by a D1 binding (Cloudflare Workers). */
export function getPrismaWithD1(d1: D1Database): PrismaClient {
  const adapter = new PrismaD1(d1);
  return new PrismaClient({ adapter }) as unknown as PrismaClient;
}

/**
 * Helper that works in both environments:
 * - In Cloudflare Workers: pass the D1 binding from getCloudflareContext().env.DB
 * - In local dev (next dev): uses the file-based SQLite client
 */
export async function getDb(): Promise<PrismaClient> {
  try {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    const { env } = await getCloudflareContext({ async: true });
    if ((env as any).DB) {
      return getPrismaWithD1((env as any).DB);
    }
  } catch {
    // Not running in Cloudflare — fall through to local
  }
  return getLocalPrisma();
}

// Re-export a lazy proxy for backward compat in local dev
export const prisma = getLocalPrisma();
