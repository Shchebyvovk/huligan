import { describe, it, expect } from "vitest";
import { buildApp } from "../index.js";
import { hashPassword } from "../../auth/hashPassword.js";

const makeDb = () => {
  const sessions = {};
  const scenarios = {};

  return {
    async findAdminByEmail(email) {
      return email === "admin@test.com" ? { id: 1, password: await hashPassword("secret") } : null;
    },
    async createSession({ token, userId, expiresAt }) { sessions[token] = { userId, expiresAt }; },
    async findSession(token) { return sessions[token] ?? null; },
    async deleteSession(token) { delete sessions[token]; },
    async getRuns() { return []; },
    async createRun(data) { return { id: 1, ...data, status: "pending" }; },
    async getScenarios() { return Object.values(scenarios); },
    async upsertScenario({ name, steps, users }) {
      scenarios[name] = { name, steps, users: users ?? null };
      return scenarios[name];
    },
    async deleteScenarioByName(name) {
      if (!scenarios[name]) return false;
      delete scenarios[name];
      return true;
    },
  };
};

const loginAndGetCookie = async (app) => {
  const res = await app.inject({
    method: "POST", url: "/api/auth/login",
    payload: { email: "admin@test.com", password: "secret" },
  });
  return res.headers["set-cookie"];
};

describe("GET /api/scenarios", () => {
  it("повертає список сценаріїв з БД", async () => {
    const db = makeDb();
    await db.upsertScenario({ name: "chat-flood", steps: [{ action: "logout" }] });

    const app = buildApp({ db, startRun: async () => {} });
    const cookie = await loginAndGetCookie(app);

    const res = await app.inject({ method: "GET", url: "/api/scenarios", headers: { cookie } });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual([{ name: "chat-flood", steps: [{ action: "logout" }] }]);
  });
});

describe("POST /api/scenarios", () => {
  it("зберігає новий сценарій у БД", async () => {
    const db = makeDb();
    const app = buildApp({ db, startRun: async () => {} });
    const cookie = await loginAndGetCookie(app);

    const res = await app.inject({
      method: "POST", url: "/api/scenarios",
      headers: { cookie },
      payload: { name: "login-loop", steps: [{ action: "logout" }] },
    });
    expect(res.statusCode).toBe(201);
    expect(res.json()).toMatchObject({ name: "login-loop", steps: [{ action: "logout" }] });

    const list = await app.inject({ method: "GET", url: "/api/scenarios", headers: { cookie } });
    expect(list.json()).toMatchObject([{ name: "login-loop", steps: [{ action: "logout" }] }]);
  });

  it("повертає 400 для невалідного DSL", async () => {
    const db = makeDb();
    const app = buildApp({ db, startRun: async () => {} });
    const cookie = await loginAndGetCookie(app);

    const res = await app.inject({
      method: "POST", url: "/api/scenarios",
      headers: { cookie },
      payload: { name: "bad", steps: [{ action: "hack" }] },
    });
    expect(res.statusCode).toBe(400);
  });
});

describe("DELETE /api/scenarios/:name", () => {
  it("видаляє сценарій і він зникає зі списку", async () => {
    const db = makeDb();
    await db.upsertScenario({ name: "chat-flood", steps: [{ action: "logout" }] });

    const app = buildApp({ db, startRun: async () => {} });
    const cookie = await loginAndGetCookie(app);

    const res = await app.inject({
      method: "DELETE", url: "/api/scenarios/chat-flood", headers: { cookie },
    });
    expect(res.statusCode).toBe(204);

    const list = await app.inject({ method: "GET", url: "/api/scenarios", headers: { cookie } });
    expect(list.json()).toEqual([]);
  });

  it("повертає 404 якщо сценарій не існує", async () => {
    const db = makeDb();
    const app = buildApp({ db, startRun: async () => {} });
    const cookie = await loginAndGetCookie(app);

    const res = await app.inject({
      method: "DELETE", url: "/api/scenarios/nonexistent", headers: { cookie },
    });
    expect(res.statusCode).toBe(404);
  });
});
