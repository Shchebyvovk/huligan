import { describe, it, expect } from "vitest";
import { buildApp } from "../index.js";
import { hashPassword } from "../../auth/hashPassword.js";

const makeDb = ({ role = "admin" } = {}) => {
  const sessions = {};
  const scheduledRuns = [];
  return {
    async findAdminByEmail(email) {
      return email === "admin@test.com"
        ? { id: 1, password: await hashPassword("secret"), role }
        : null;
    },
    async findAdminById(id) {
      return id === 1 ? { id: 1, email: "admin@test.com", role } : null;
    },
    async createSession({ token, userId, expiresAt }) { sessions[token] = { userId, expiresAt }; },
    async findSession(token) { return sessions[token] ?? null; },
    async deleteSession(token) { delete sessions[token]; },
    async getScheduledRuns() { return scheduledRuns; },
    async createScheduledRun(data) {
      const run = { id: scheduledRuns.length + 1, ...data };
      scheduledRuns.push(run);
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

const resolveHost = async () => ["93.184.216.34"];

describe("POST /api/scheduled", () => {
  it("створює заплановий ран", async () => {
    const app = buildApp({ db: makeDb(), resolveHost });
    const cookie = await loginAndGetCookie(app);

    const res = await app.inject({
      method: "POST", url: "/api/scheduled",
      headers: { cookie },
      payload: { scenarioName: "chat-flood", targetUrl: "https://target.example.com", concurrency: 50, scheduledAt: new Date().toISOString() },
    });
    expect(res.statusCode).toBe(201);
  });

  it("повертає 400 якщо concurrency перевищує MAX_CONCURRENCY", async () => {
    const app = buildApp({ db: makeDb(), resolveHost });
    const cookie = await loginAndGetCookie(app);

    const res = await app.inject({
      method: "POST", url: "/api/scheduled",
      headers: { cookie },
      payload: { scenarioName: "chat-flood", targetUrl: "https://target.example.com", concurrency: 999999, scheduledAt: new Date().toISOString() },
    });
    expect(res.statusCode).toBe(400);
  });

  it("повертає 400 якщо targetUrl вказує на приватну/внутрішню адресу (SSRF, у т.ч. повторюваний repeatIntervalMs)", async () => {
    const app = buildApp({ db: makeDb() });
    const cookie = await loginAndGetCookie(app);

    const res = await app.inject({
      method: "POST", url: "/api/scheduled",
      headers: { cookie },
      payload: {
        scenarioName: "chat-flood", targetUrl: "http://127.0.0.1:5432/", concurrency: 50,
        scheduledAt: new Date().toISOString(), repeatIntervalMs: 60000, maxIterations: 1000,
      },
    });
    expect(res.statusCode).toBe(400);
  });

  it("повертає 400 якщо хост резолвиться у приватну адресу (DNS rebinding)", async () => {
    const app = buildApp({ db: makeDb(), resolveHost: async () => ["172.16.0.1"] });
    const cookie = await loginAndGetCookie(app);

    const res = await app.inject({
      method: "POST", url: "/api/scheduled",
      headers: { cookie },
      payload: { scenarioName: "chat-flood", targetUrl: "https://sneaky.example.com", concurrency: 10, scheduledAt: new Date().toISOString() },
    });
    expect(res.statusCode).toBe(400);
  });

  it("viewer отримує 403 (не може планувати повторюваний флуд)", async () => {
    const app = buildApp({ db: makeDb({ role: "viewer" }), resolveHost });
    const cookie = await loginAndGetCookie(app);

    const res = await app.inject({
      method: "POST", url: "/api/scheduled",
      headers: { cookie },
      payload: { scenarioName: "chat-flood", targetUrl: "https://target.example.com", concurrency: 50, scheduledAt: new Date().toISOString() },
    });
    expect(res.statusCode).toBe(403);
  });
});
