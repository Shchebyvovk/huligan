import pg from "pg";
import { buildApp } from "./src/server/index.js";
import { createPgAdapter } from "./src/db/pgAdapter.js";

const { Pool } = pg;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = createPgAdapter(pool);
const app = buildApp({ db });

app.listen({ port: process.env.PORT ?? 3000, host: "0.0.0.0" }, (err, address) => {
  if (err) { console.error(err); process.exit(1); }
  console.log(`Server running at ${address}`);
});
