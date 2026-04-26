import { drizzle, DrizzleD1Database } from "drizzle-orm/d1";
import * as schema from "./schema";

export type Database = DrizzleD1Database<typeof schema>;

export async function getDb(): Promise<Database> {
  const { getCloudflareContext } = await import("@opennextjs/cloudflare");
  const ctx = await getCloudflareContext({ async: true });
  const d1 = (ctx.env as unknown as { DB: D1Database }).DB;
  return drizzle(d1, { schema });
}

export { schema };
