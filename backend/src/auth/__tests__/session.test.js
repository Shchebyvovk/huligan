import { describe, it, expect } from "vitest";
import { createSession, validateSession, deleteSession } from "../session.js";
import { hashToken } from "../tokenHash.js";

const makeDb = () => {
  const store = {};
  return {
    async createSession({ token, userId, expiresAt }) {
      store[token] = { userId, expiresAt };
    },
    async findSession(token) {
      return store[token] ?? null;
    },
    async deleteSession(token) {
      delete store[token];
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
    // db.createSession отримує ХЕШ токена, не сирий рядок — findSession(token)
    // напряму більше не знайде рядок, це і є ціль (сесії не plaintext у БД).
    const session = await db.findSession(hashToken(token));
    expect(session.userId).toBe(42);
    expect(session.expiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  it("не зберігає сирий токен у db як ключ (сесії більше не plaintext)", async () => {
    const db = makeDb();
    const token = await createSession(42, db);
    expect(await db.findSession(token)).toBeNull();
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

describe("deleteSession", () => {
  it("хешує токен перед викликом db.deleteSession (той самий ключ, яким зберігали)", async () => {
    const db = makeDb();
    const token = await createSession(1, db);
    expect(await validateSession(token, db)).toEqual({ userId: 1 });

    await deleteSession(token, db);
    expect(await validateSession(token, db)).toBeNull();
  });
});
