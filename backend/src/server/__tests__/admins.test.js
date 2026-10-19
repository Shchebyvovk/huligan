import { describe, it, expect } from "vitest";
import { buildApp } from "../index.js";
import { hashPassword } from "../../auth/hashPassword.js";
import { hashToken } from "../../auth/tokenHash.js";

const makeDb = () => {
  const sessions = {};
  const invites = {};
  const admins = [];
  return {
    async findAdminByEmail(email) {
      if (email === "admin@test.com") return { id: 1, password: await hashPassword("secret") };
      return admins.find((a) => a.email === email) ?? null;
    },
    async createSession({ token, userId, expiresAt }) { sessions[token] = { userId, expiresAt }; },
    async findSession(token) { return sessions[token] ?? null; },
    async deleteSession(token) { delete sessions[token]; },
    async getAdmins() { return admins; },
    async createInvite({ token, email, invitedBy, expiresAt }) {
      invites[token] = { email, invitedBy, expiresAt, usedAt: null };
    },
    async findInvite(token) {
      const inv = invites[token];
      if (!inv || inv.usedAt || inv.expiresAt < new Date()) return null;
      return { email: inv.email };
    },
    async useInvite(token) {
      if (invites[token]) invites[token].usedAt = new Date();
    },
    async createAdmin({ email, password }) {
      const admin = { id: admins.length + 2, email, password };
      admins.push(admin);
      return admin;
    },
    _rawInvites: invites,
  };
};

const loginAndGetCookie = async (app) => {
  const res = await app.inject({
    method: "POST", url: "/api/auth/login",
    payload: { email: "admin@test.com", password: "secret" },
  });
  return res.headers["set-cookie"];
};

describe("POST /api/admins/invite", () => {
  it("зберігає ХЕШ токена в db, не сирий токен з посилання", async () => {
    const db = makeDb();
    const app = buildApp({ db });
    const cookie = await loginAndGetCookie(app);

    const res = await app.inject({
      method: "POST", url: "/api/admins/invite",
      headers: { cookie },
      payload: { email: "new-admin@test.com" },
    });
    expect(res.statusCode).toBe(201);
    const { link } = res.json();
    const rawToken = link.split("/invite/")[1];

    expect(db._rawInvites[rawToken]).toBeUndefined();
    expect(db._rawInvites[hashToken(rawToken)]).toBeDefined();
  });

  it("повертає 409, якщо адмін з таким email вже існує", async () => {
    const app = buildApp({ db: makeDb() });
    const cookie = await loginAndGetCookie(app);

    const res = await app.inject({
      method: "POST", url: "/api/admins/invite",
      headers: { cookie },
      payload: { email: "admin@test.com" },
    });
    expect(res.statusCode).toBe(409);
  });
});

describe("GET+POST /api/invite/:token (прийняття запрошення, публічний шлях)", () => {
  it("повний цикл: invite -> перевірка токена -> accept -> новий адмін може залогінитись", async () => {
    const db = makeDb();
    const app = buildApp({ db });
    const cookie = await loginAndGetCookie(app);

    const inviteRes = await app.inject({
      method: "POST", url: "/api/admins/invite",
      headers: { cookie },
      payload: { email: "new-admin@test.com" },
    });
    const rawToken = inviteRes.json().link.split("/invite/")[1];

    const checkRes = await app.inject({ method: "GET", url: `/api/invite/${rawToken}` });
    expect(checkRes.statusCode).toBe(200);
    expect(checkRes.json().email).toBe("new-admin@test.com");

    const acceptRes = await app.inject({
      method: "POST", url: `/api/invite/${rawToken}`,
      payload: { password: "brandnewpass" },
    });
    expect(acceptRes.statusCode).toBe(200);

    const newLogin = await app.inject({
      method: "POST", url: "/api/auth/login",
      payload: { email: "new-admin@test.com", password: "brandnewpass" },
    });
    expect(newLogin.statusCode).toBe(200);
  });

  it("повторне прийняття того самого токена -> 404 (invite вже використаний)", async () => {
    const db = makeDb();
    const app = buildApp({ db });
    const cookie = await loginAndGetCookie(app);

    const inviteRes = await app.inject({
      method: "POST", url: "/api/admins/invite",
      headers: { cookie },
      payload: { email: "new-admin@test.com" },
    });
    const rawToken = inviteRes.json().link.split("/invite/")[1];

    await app.inject({ method: "POST", url: `/api/invite/${rawToken}`, payload: { password: "first-pass123" } });
    const second = await app.inject({ method: "POST", url: `/api/invite/${rawToken}`, payload: { password: "second-pass456" } });
    expect(second.statusCode).toBe(404);
  });

  it("невідомий/сфабрикований токен -> 404", async () => {
    const app = buildApp({ db: makeDb() });
    const res = await app.inject({ method: "GET", url: "/api/invite/totally-made-up-token" });
    expect(res.statusCode).toBe(404);
  });
});
