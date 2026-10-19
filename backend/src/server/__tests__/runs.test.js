import { describe, it, expect } from "vitest";
import { buildApp } from "../index.js";
import { hashPassword } from "../../auth/hashPassword.js";

const makeDb = ({ role = "admin" } = {}) => {
  const sessions = {};
  const runs = [
    { id: 2, scenario: "chat-flood", concurrency: 100, status: "completed" },
    { id: 1, scenario: "login-loop", concurrency: 50,  status: "failed" },
  ];
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
    async pruneRuns() {},
    async purgeTrash() {},
    async getTrashedRuns() { return []; },
    async softDeleteRuns() {},
    async restoreRuns() {},
    async hardDeleteRuns() {},
    async getRuns() { return runs; },
    async createRun({ scenario, concurrency, targetUrl }) {
      const run = { id: runs.length + 1, scenario, concurrency, targetUrl, status: "pending" };
      runs.unshift(run);
      return run;
    },
    async updateRunStatus() {},
  };
};

const loginAndGetCookie = async (app) => {
  const res = await app.inject({
    method: "POST", url: "/api/auth/login",
    payload: { email: "admin@test.com", password: "secret" },
  });
  return res.headers["set-cookie"];
};

// targetUrl тепер перевіряється через validateTargetUrl (DNS-резолв хоста) —
// resolveHost тут завжди повертає публічну IP, щоб тести не ходили в
// реальну мережу (той самий DI-паттерн, що db-адаптер).
const resolveHost = async () => ["93.184.216.34"];

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

describe("POST /api/runs — рольовий доступ", () => {
  it("viewer отримує 403 (не може запускати тести, лише дивитись)", async () => {
    const app = buildApp({ db: makeDb({ role: "viewer" }), startRun: async () => {}, resolveHost });
    const cookie = await loginAndGetCookie(app);

    const res = await app.inject({
      method: "POST", url: "/api/runs",
      headers: { cookie },
      payload: { scenario: "chat-flood", concurrency: 10, targetUrl: "https://target.example.com" },
    });
    expect(res.statusCode).toBe(403);
  });

  it("viewer все одно МОЖЕ дивитись список ранів (GET не гейтується роллю)", async () => {
    const app = buildApp({ db: makeDb({ role: "viewer" }), startRun: async () => {} });
    const cookie = await loginAndGetCookie(app);

    const res = await app.inject({ method: "GET", url: "/api/runs", headers: { cookie } });
    expect(res.statusCode).toBe(200);
  });
});

describe("POST /api/runs", () => {
  it("створює новий ран і повертає його", async () => {
    const app = buildApp({ db: makeDb(), startRun: async () => {}, resolveHost });
    const cookie = await loginAndGetCookie(app);

    const res = await app.inject({
      method: "POST", url: "/api/runs",
      headers: { cookie },
      payload: { scenario: "chat-flood", concurrency: 500, targetUrl: "https://target.example.com" },
    });
    const body = res.json();
    expect(res.statusCode).toBe(201);
    expect(body.scenario).toBe("chat-flood");
    expect(body.concurrency).toBe(500);
    expect(body.status).toBe("pending");
  });

  it("повертає 400 якщо concurrency відсутній", async () => {
    const app = buildApp({ db: makeDb(), startRun: async () => {}, resolveHost });
    const cookie = await loginAndGetCookie(app);

    const res = await app.inject({
      method: "POST", url: "/api/runs",
      headers: { cookie },
      payload: { scenario: "chat-flood", targetUrl: "https://t.com" },
    });
    expect(res.statusCode).toBe(400);
  });

  it("повертає 400 якщо targetUrl відсутній", async () => {
    const app = buildApp({ db: makeDb(), startRun: async () => {}, resolveHost });
    const cookie = await loginAndGetCookie(app);

    const res = await app.inject({
      method: "POST", url: "/api/runs",
      headers: { cookie },
      payload: { scenario: "chat-flood", concurrency: 100 },
    });
    expect(res.statusCode).toBe(400);
  });

  it("повертає 400 якщо concurrency перевищує MAX_CONCURRENCY", async () => {
    const app = buildApp({ db: makeDb(), startRun: async () => {}, resolveHost });
    const cookie = await loginAndGetCookie(app);

    const res = await app.inject({
      method: "POST", url: "/api/runs",
      headers: { cookie },
      payload: { scenario: "chat-flood", concurrency: 999999, targetUrl: "https://target.example.com" },
    });
    expect(res.statusCode).toBe(400);
  });

  it("повертає 400 якщо targetUrl вказує на приватну/внутрішню адресу (SSRF)", async () => {
    const app = buildApp({ db: makeDb(), startRun: async () => {} });
    const cookie = await loginAndGetCookie(app);

    const res = await app.inject({
      method: "POST", url: "/api/runs",
      headers: { cookie },
      payload: { scenario: "chat-flood", concurrency: 10, targetUrl: "http://169.254.169.254/latest/meta-data/" },
    });
    expect(res.statusCode).toBe(400);
  });

  it("повертає 400 якщо хост targetUrl резолвиться у приватну адресу (DNS rebinding)", async () => {
    const app = buildApp({
      db: makeDb(), startRun: async () => {},
      resolveHost: async () => ["10.0.0.5"],
    });
    const cookie = await loginAndGetCookie(app);

    const res = await app.inject({
      method: "POST", url: "/api/runs",
      headers: { cookie },
      payload: { scenario: "chat-flood", concurrency: 10, targetUrl: "https://sneaky.example.com" },
    });
    expect(res.statusCode).toBe(400);
  });
});
