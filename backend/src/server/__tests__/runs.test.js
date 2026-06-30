import { describe, it, expect } from "vitest";
import { buildApp } from "../index.js";
import { hashPassword } from "../../auth/hashPassword.js";

const makeDb = () => {
  const sessions = {};
  const runs = [
    { id: 2, scenario: "chat-flood", concurrency: 100, status: "completed" },
    { id: 1, scenario: "login-loop", concurrency: 50,  status: "failed" },
  ];
  return {
    async findAdminByEmail(email) {
      return email === "admin@test.com"
        ? { id: 1, password: await hashPassword("secret") }
        : null;
    },
    async createSession({ token, userId, expiresAt }) { sessions[token] = { userId, expiresAt }; },
    async findSession(token) { return sessions[token] ?? null; },
    async deleteSession(token) { delete sessions[token]; },
    async getRuns() { return runs; },
    async createRun({ scenario, concurrency }) {
      const run = { id: runs.length + 1, scenario, concurrency, status: "pending" };
      runs.unshift(run);
      return run;
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

describe("GET /api/runs", () => {
  it("повертає список ранів", async () => {
    const app = buildApp({ db: makeDb(), startRun: async () => {} });
    const cookie = await loginAndGetCookie(app);

    const res = await app.inject({ method: "GET", url: "/api/runs", headers: { cookie } });
    const body = res.json();
    expect(res.statusCode).toBe(200);
    expect(body).toHaveLength(2);
    expect(body[0].scenario).toBe("chat-flood");
  });
});

describe("POST /api/runs", () => {
  it("створює новий ран і повертає його", async () => {
    const app = buildApp({ db: makeDb(), startRun: async () => {} });
    const cookie = await loginAndGetCookie(app);

    const res = await app.inject({
      method: "POST", url: "/api/runs",
      headers: { cookie },
      payload: { scenario: "chat-flood", concurrency: 500 },
    });
    const body = res.json();
    expect(res.statusCode).toBe(201);
    expect(body.scenario).toBe("chat-flood");
    expect(body.concurrency).toBe(500);
    expect(body.status).toBe("pending");
  });

  it("повертає 400 якщо concurrency відсутній", async () => {
    const app = buildApp({ db: makeDb(), startRun: async () => {} });
    const cookie = await loginAndGetCookie(app);

    const res = await app.inject({
      method: "POST", url: "/api/runs",
      headers: { cookie },
      payload: { scenario: "chat-flood" },
    });
    expect(res.statusCode).toBe(400);
  });
});
