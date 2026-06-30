export function createPgAdapter(pool) {
  return {
    async findAdminByEmail(email) {
      const { rows } = await pool.query(
        "SELECT id, password FROM admin_users WHERE email = $1",
        [email]
      );
      return rows[0] ?? null;
    },

    async createSession({ token, userId, expiresAt }) {
      await pool.query(
        "INSERT INTO sessions (token, user_id, expires_at) VALUES ($1, $2, $3)",
        [token, userId, expiresAt]
      );
    },

    async findSession(token) {
      const { rows } = await pool.query(
        `SELECT user_id AS "userId", expires_at AS "expiresAt" FROM sessions WHERE token = $1`,
        [token]
      );
      return rows[0] ?? null;
    },

    async deleteSession(token) {
      await pool.query("DELETE FROM sessions WHERE token = $1", [token]);
    },

    async getRuns() {
      const { rows } = await pool.query(
        `SELECT id, scenario, concurrency, target_url AS "targetUrl", status, results, created_at AS "createdAt"
         FROM test_runs ORDER BY created_at DESC`
      );
      return rows;
    },

    async updateRunStatus(id, status, results = null) {
      await pool.query(
        `UPDATE test_runs SET status = $2, results = COALESCE($3, results),
           started_at = CASE WHEN $2 = 'running' THEN now() ELSE started_at END,
           finished_at = CASE WHEN $2 IN ('completed','failed') THEN now() ELSE finished_at END
         WHERE id = $1`,
        [id, status, results ? JSON.stringify(results) : null]
      );
    },

    async createRun({ scenario, concurrency, targetUrl }) {
      const { rows } = await pool.query(
        `INSERT INTO test_runs (scenario, concurrency, target_url, status)
         VALUES ($1, $2, $3, $4)
         RETURNING id, scenario, concurrency, target_url AS "targetUrl", status, created_at AS "createdAt"`,
        [scenario, concurrency, targetUrl, "pending"]
      );
      return rows[0];
    },
  };
}
