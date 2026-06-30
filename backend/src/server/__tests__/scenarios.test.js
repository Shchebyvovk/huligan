import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm, writeFile } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { buildApp } from "../index.js";
import { hashPassword } from "../../auth/hashPassword.js";

let dir;

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), "huligan-scenarios-route-"));
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

const makeDb = () => {
  const sessions = {};
  return {
    async findAdminByEmail(email) {
      return email === "admin@test.com" ? { id: 1, password: await hashPassword("secret") } : null;
    },
    async createSession({ token, userId, expiresAt }) { sessions[token] = { userId, expiresAt }; },
    async findSession(token) { return sessions[token] ?? null; },
    async deleteSession(token) { delete sessions[token]; },
    async getRuns() { return []; },
    async createRun(data) { return { id: 1, ...data, status: "pending" }; },
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
  it("повертає список сценаріїв з директорії", async () => {
    await writeFile(
      join(dir, "chat-flood.json"),
      JSON.stringify([{ action: "logout" }])
    );

    const app = buildApp({ db: makeDb(), scenariosDir: dir, startRun: async () => {} });
    const cookie = await loginAndGetCookie(app);

    const res = await app.inject({ method: "GET", url: "/api/scenarios", headers: { cookie } });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual([{ name: "chat-flood", steps: [{ action: "logout" }] }]);
  });
});

describe("POST /api/scenarios", () => {
  it("зберігає новий сценарій у директорію", async () => {
    const app = buildApp({ db: makeDb(), scenariosDir: dir, startRun: async () => {} });
    const cookie = await loginAndGetCookie(app);

    const res = await app.inject({
      method: "POST", url: "/api/scenarios",
      headers: { cookie },
      payload: { name: "login-loop", steps: [{ action: "logout" }] },
    });
    expect(res.statusCode).toBe(201);
    expect(res.json()).toEqual({ name: "login-loop", steps: [{ action: "logout" }] });

    const list = await app.inject({ method: "GET", url: "/api/scenarios", headers: { cookie } });
    expect(list.json()).toEqual([{ name: "login-loop", steps: [{ action: "logout" }] }]);
  });

  it("повертає 400 для невалідного DSL", async () => {
    const app = buildApp({ db: makeDb(), scenariosDir: dir, startRun: async () => {} });
    const cookie = await loginAndGetCookie(app);

    const res = await app.inject({
      method: "POST", url: "/api/scenarios",
      headers: { cookie },
      payload: { name: "bad", steps: [{ action: "hack" }] },
    });
    expect(res.statusCode).toBe(400);
  });
});
