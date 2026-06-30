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
        `SELECT id, scenario, concurrency, status, created_at AS "createdAt"
         FROM test_runs ORDER BY created_at DESC`
      );
      return rows;
    },

    async createRun({ scenario, concurrency }) {
      const { rows } = await pool.query(
        `INSERT INTO test_runs (scenario, concurrency, status)
         VALUES ($1, $2, $3)
         RETURNING id, scenario, concurrency, status, created_at AS "createdAt"`,
        [scenario, concurrency, "pending"]
      );
      return rows[0];
    },
  };
}
