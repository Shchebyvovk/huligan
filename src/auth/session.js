import { randomBytes } from "node:crypto";

const DEFAULT_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export async function createSession(userId, db, { ttlMs = DEFAULT_TTL_MS } = {}) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + ttlMs);
  await db.createSession({ token, userId, expiresAt });
  return token;
}

export async function validateSession(token, db) {
  const session = await db.findSession(token);
  if (!session) return null;
  if (session.expiresAt < new Date()) return null;
  return { userId: session.userId };
}
