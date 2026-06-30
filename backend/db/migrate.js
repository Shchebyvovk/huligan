import pg from "pg";
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

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

  const dir = join(__dirname, "migrations");
  const files = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();

  for (const file of files) {
    const { rows } = await pool.query(
      "SELECT 1 FROM schema_migrations WHERE version = $1",
      [file]
    );
    if (rows.length > 0) {
      console.log(`skip:    ${file}`);
      continue;
    }
    const sql = readFileSync(join(dir, file), "utf8");
    await pool.query(sql);
    await pool.query("INSERT INTO schema_migrations (version) VALUES ($1)", [file]);
    console.log(`applied: ${file}`);
  }

  await pool.end();
}

migrate().catch((err) => {
  console.error(err);
  process.exit(1);
});
