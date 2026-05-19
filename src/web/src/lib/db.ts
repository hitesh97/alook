import { createDb, type Database } from "@alook/shared"

export function getDb(d1: D1Database): Database {
  const session = d1.withSession("first-primary")
  // D1DatabaseSession has prepare() + batch() which is all Drizzle uses at runtime.
  // Native Drizzle support tracked at https://github.com/drizzle-team/drizzle-orm/issues/4522
  return createDb(session as unknown as Parameters<typeof createDb>[0])
}

export function getReadDb(d1: D1Database): Database {
  const session = d1.withSession("first-unconstrained")
  return createDb(session as unknown as Parameters<typeof createDb>[0])
}

export async function withD1Retry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i === retries) throw err;
      await new Promise((r) => setTimeout(r, 100 * 2 ** i));
    }
  }
  throw new Error("unreachable");
}
