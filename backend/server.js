import pg from "pg";
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { buildApp } from "./src/server/index.js";
import { createPgAdapter } from "./src/db/pgAdapter.js";
import { startScheduler } from "./src/scheduler/scheduler.js";
import { runJob } from "./src/orchestrator/runJob.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const { Pool } = pg;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function migrate() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version    TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);

  const dir = join(__dirname, "db/migrations");
  const files = readdirSync(dir).filter(f => f.endsWith(".sql")).sort();

  for (const file of files) {
    const { rows } = await pool.query(
      "SELECT 1 FROM schema_migrations WHERE version = $1", [file]
    );
    if (rows.length > 0) { console.log(`skip:    ${file}`); continue; }
    const sql = readFileSync(join(dir, file), "utf8");
    await pool.query(sql);
    await pool.query("INSERT INTO schema_migrations (version) VALUES ($1)", [file]);
    console.log(`applied: ${file}`);
  }
}

async function start() {
  await migrate();

  const db = createPgAdapter(pool);
  const app = buildApp({ db });
  startScheduler(db, runJob);

  app.listen({ port: process.env.PORT ?? 3000, host: "0.0.0.0" }, (err, address) => {
    if (err) { console.error(err); process.exit(1); }
    console.log(`Server running at ${address}`);
  });
}

start().catch(err => { console.error(err); process.exit(1); });
