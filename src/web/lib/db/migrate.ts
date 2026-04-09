import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { log } from "../logger";

const connectionString =
  process.env.DATABASE_URL ||
  "postgres://postgres:postgres@localhost:5432/alook?sslmode=disable";

async function main() {
  const client = postgres(connectionString, { max: 1 });
  const db = drizzle(client);

  log.info("Running migrations...");
  await migrate(db, { migrationsFolder: "./drizzle" });
  log.info("Migrations complete.");

  await client.end();
  process.exit(0);
}

main().catch((err) => {
  log.error("Migration failed", { err });
  process.exit(1);
});
