import { describe, it, expect } from "vitest";
import { createSession, validateSession } from "../session.js";

const makeDb = () => {
  const store = {};
  return {
    async createSession({ token, userId, expiresAt }) {
      store[token] = { userId, expiresAt };
    },
    async findSession(token) {
      return store[token] ?? null;
    },
  };
};

describe("createSession", () => {
  it("повертає hex-токен довжиною 64 символи", async () => {
    const token = await createSession(1, makeDb());
    expect(token).toMatch(/^[a-f0-9]{64}$/);
  });

  it("кожен виклик генерує унікальний токен", async () => {
    const db = makeDb();
    const t1 = await createSession(1, db);
    const t2 = await createSession(1, db);
    expect(t1).not.toBe(t2);
  });

  it("зберігає сесію в db з правильним userId і майбутнім expiresAt", async () => {
    const db = makeDb();
    const token = await createSession(42, db);
    const session = await db.findSession(token);
    expect(session.userId).toBe(42);
    expect(session.expiresAt.getTime()).toBeGreaterThan(Date.now());
  });
});

describe("validateSession", () => {
  it("повертає { userId } для валідного токена", async () => {
    const db = makeDb();
    const token = await createSession(7, db);
    const result = await validateSession(token, db);
    expect(result).toEqual({ userId: 7 });
  });

  it("повертає null для невідомого токена", async () => {
    const result = await validateSession("nonexistent", makeDb());
    expect(result).toBeNull();
  });

  it("повертає null для протермінованої сесії", async () => {
    const db = makeDb();
    const token = await createSession(1, db, { ttlMs: -1000 });
    const result = await validateSession(token, db);
    expect(result).toBeNull();
  });
});
