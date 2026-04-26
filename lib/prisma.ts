import { PrismaClient } from "@prisma/client";
import { PrismaD1 } from "@prisma/adapter-d1";

/**
 * Returns a PrismaClient for the current environment.
 * - On Cloudflare Workers: uses D1 via getCloudflareContext
 * - On local dev (next dev): uses file-based SQLite
 */
export async function getDb(): Promise<PrismaClient> {
  try {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    const ctx = await getCloudflareContext({ async: true });
    const db = (ctx.env as unknown as Record<string, unknown>).DB as D1Database | undefined;
    if (db) {
      const adapter = new PrismaD1(db);
      return new PrismaClient({ adapter }) as unknown as PrismaClient;
    }
  } catch {
    // Not on Cloudflare
  }

  // Local dev fallback
  return getLocalClient();
}

// Singleton for local dev only
let _local: PrismaClient | undefined;
function getLocalClient(): PrismaClient {
  if (!_local) {
    _local = new PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    });
  }
  return _local;
}
