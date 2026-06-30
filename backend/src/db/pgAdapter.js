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

    async getUsersStats(targetUrl) {
      const { rows } = await pool.query(
        `SELECT
           COUNT(*)::int AS total,
           COUNT(*) FILTER (WHERE NOT (registered_in @> $1::jsonb))::int AS fresh
         FROM test_users`,
        [JSON.stringify([targetUrl])]
      )
      return rows[0]
    },

    async insertUsers(users) {
      if (users.length === 0) return
      const values = users.map((u, i) => {
        const base = i * 6
        return `($${base+1},$${base+2},$${base+3},$${base+4},$${base+5},$${base+6})`
      }).join(',')
      const params = users.flatMap(u => [u.firstName, u.lastName, u.email, u.phone, u.address, u.password])
      await pool.query(
        `INSERT INTO test_users (first_name, last_name, email, phone, address, password) VALUES ${values}
         ON CONFLICT (email) DO NOTHING`,
        params
      )
    },

    async pickUsers({ count, targetUrl }) {
      // fresh юзери (ще не реєстровані в цьому додатку) — рандомний порядок
      const { rows } = await pool.query(
        `SELECT id, first_name AS "firstName", last_name AS "lastName",
                email, phone, address, password
         FROM test_users
         WHERE NOT (registered_in @> $1::jsonb)
         ORDER BY random()
         LIMIT $2`,
        [JSON.stringify([targetUrl]), count]
      )
      return rows
    },

    async markUsersRegistered(userIds, targetUrl) {
      if (userIds.length === 0) return
      await pool.query(
        `UPDATE test_users
         SET registered_in = registered_in || $1::jsonb
         WHERE id = ANY($2) AND NOT (registered_in @> $1::jsonb)`,
        [JSON.stringify([targetUrl]), userIds]
      )
    },

    async createRun({ scenario, concurrency, targetUrl, usersCount = null }) {
      const { rows } = await pool.query(
        `INSERT INTO test_runs (scenario, concurrency, target_url, users_count, status)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, scenario, concurrency, target_url AS "targetUrl",
                   users_count AS "usersCount", status, created_at AS "createdAt"`,
        [scenario, concurrency, targetUrl, usersCount, "pending"]
      );
      return rows[0];
    },
  };
}
