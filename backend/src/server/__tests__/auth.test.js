import { describe, it, expect, beforeEach } from "vitest";
import { buildApp } from "../index.js";
import { hashPassword } from "../../auth/hashPassword.js";

const makeDb = ({ passwordOverride } = {}) => {
  const sessions = {};
  return {
    async findAdminByEmail(email) {
      if (email !== "admin@test.com") return null;
      return { id: 1, password: passwordOverride ?? await hashPassword("secret") };
    },
    async createSession({ token, userId, expiresAt }) { sessions[token] = { userId, expiresAt }; },
    async findSession(token) { return sessions[token] ?? null; },
    async deleteSession(token) { delete sessions[token]; },
    async pruneRuns() {},
    async getRuns() { return []; },
    async createRun(data) { return { id: 1, ...data, status: "pending" }; },
  };
};

describe("POST /api/auth/login", () => {
  it("повертає 200 і встановлює cookie для вірних даних", async () => {
    const app = buildApp({ db: makeDb() });
    const res = await app.inject({
      method: "POST", url: "/api/auth/login",
      payload: { email: "admin@test.com", password: "secret" },
    });
    expect(res.statusCode).toBe(200);
    expect(res.headers["set-cookie"]).toMatch(/session=/);
  });

  it("повертає 401 для невірного пароля", async () => {
    const app = buildApp({ db: makeDb() });
    const res = await app.inject({
      method: "POST", url: "/api/auth/login",
      payload: { email: "admin@test.com", password: "wrong" },
    });
    expect(res.statusCode).toBe(401);
  });

  it("повертає 401 для невідомого email", async () => {
    const app = buildApp({ db: makeDb() });
    const res = await app.inject({
      method: "POST", url: "/api/auth/login",
      payload: { email: "nobody@test.com", password: "secret" },
    });
    expect(res.statusCode).toBe(401);
  });
});

describe("POST /api/auth/logout", () => {
  it("повертає 200 і очищає cookie", async () => {
    const db = makeDb();
    const app = buildApp({ db });

    const login = await app.inject({
      method: "POST", url: "/api/auth/login",
      payload: { email: "admin@test.com", password: "secret" },
    });
    const cookie = login.headers["set-cookie"];

    const res = await app.inject({
      method: "POST", url: "/api/auth/logout",
      headers: { cookie },
    });
    expect(res.statusCode).toBe(200);
    expect(res.headers["set-cookie"]).toMatch(/session=;/);
  });
});

describe("захищені роути", () => {
  it("повертає 401 без сесії", async () => {
    const app = buildApp({ db: makeDb() });
    const res = await app.inject({ method: "GET", url: "/api/runs" });
    expect(res.statusCode).toBe(401);
  });

  it("повертає 200 з валідною сесією", async () => {
    const db = makeDb();
    const app = buildApp({ db });

    const login = await app.inject({
      method: "POST", url: "/api/auth/login",
      payload: { email: "admin@test.com", password: "secret" },
    });
    const cookie = login.headers["set-cookie"];

    const res = await app.inject({
      method: "GET", url: "/api/runs",
      headers: { cookie },
    });
    expect(res.statusCode).toBe(200);
  });
});
