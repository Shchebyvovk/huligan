import { describe, it, expect } from "vitest";
import { buildApp } from "../index.js";
import { hashPassword } from "../../auth/hashPassword.js";
import { hashToken } from "../../auth/tokenHash.js";

const makeDb = ({ ownerRole = "superadmin" } = {}) => {
  const sessions = {};
  const invites = {};
  const admins = [{ id: 1, email: "admin@test.com", role: ownerRole }];
  let nextId = 2;

  return {
    async findAdminByEmail(email) {
      const admin = admins.find((a) => a.email === email);
      if (!admin) return null;
      return admin.email === "admin@test.com"
        ? { ...admin, password: await hashPassword("secret") }
        : admin;
    },
    async findAdminById(id) {
      return admins.find((a) => a.id === id) ?? null;
    },
    async createSession({ token, userId, expiresAt }) { sessions[token] = { userId, expiresAt }; },
    async findSession(token) { return sessions[token] ?? null; },
    async deleteSession(token) { delete sessions[token]; },
    async getAdmins() { return admins; },
    async countSuperadmins() { return admins.filter((a) => a.role === "superadmin").length; },
    async updateAdminRole(id, role) {
      const admin = admins.find((a) => a.id === id);
      if (!admin) return null;
      admin.role = role;
      return admin;
    },
    async createInvite({ token, email, invitedBy, expiresAt, role }) {
      invites[token] = { email, invitedBy, expiresAt, role, usedAt: null };
    },
    async findInvite(token) {
      const inv = invites[token];
      if (!inv || inv.usedAt || inv.expiresAt < new Date()) return null;
      return { email: inv.email, role: inv.role };
    },
    async useInvite(token) {
      if (invites[token]) invites[token].usedAt = new Date();
    },
    async createAdmin({ email, password, role }) {
      const admin = { id: nextId++, email, password, role };
      admins.push(admin);
      return admin;
    },
    _rawInvites: invites,
  };
};

const loginAndGetCookie = async (app, email = "admin@test.com", password = "secret") => {
  const res = await app.inject({
    method: "POST", url: "/api/auth/login",
    payload: { email, password },
  });
  return res.headers["set-cookie"];
};

describe("GET /api/admins", () => {
  it("admin/superadmin бачать список, viewer -> 403", async () => {
    const db = makeDb({ ownerRole: "admin" });
    const app = buildApp({ db });
    const cookie = await loginAndGetCookie(app);
    const res = await app.inject({ method: "GET", url: "/api/admins", headers: { cookie } });
    expect(res.statusCode).toBe(200);
  });

  it("viewer отримує 403", async () => {
    const db = makeDb({ ownerRole: "viewer" });
    const app = buildApp({ db });
    const cookie = await loginAndGetCookie(app);
    const res = await app.inject({ method: "GET", url: "/api/admins", headers: { cookie } });
    expect(res.statusCode).toBe(403);
  });
});

describe("POST /api/admins/invite", () => {
  it("superadmin запрошує з конкретною роллю, зберігає ХЕШ токена в db", async () => {
    const db = makeDb();
    const app = buildApp({ db });
    const cookie = await loginAndGetCookie(app);

    const res = await app.inject({
      method: "POST", url: "/api/admins/invite",
      headers: { cookie },
      payload: { email: "new-viewer@test.com", role: "viewer" },
    });
    expect(res.statusCode).toBe(201);
    const { link, role } = res.json();
    expect(role).toBe("viewer");
    const rawToken = link.split("/invite/")[1];

    expect(db._rawInvites[rawToken]).toBeUndefined();
    expect(db._rawInvites[hashToken(rawToken)]).toBeDefined();
    expect(db._rawInvites[hashToken(rawToken)].role).toBe("viewer");
  });

  it("без role у тілі -> дефолт 'admin' (ніколи не мовчазний superadmin)", async () => {
    const db = makeDb();
    const app = buildApp({ db });
    const cookie = await loginAndGetCookie(app);

    const res = await app.inject({
      method: "POST", url: "/api/admins/invite",
      headers: { cookie },
      payload: { email: "new-admin@test.com" },
    });
    expect(res.json().role).toBe("admin");
  });

  it("admin (не superadmin) отримує 403 — запрошення нових адмінів тільки для superadmin", async () => {
    const db = makeDb({ ownerRole: "admin" });
    const app = buildApp({ db });
    const cookie = await loginAndGetCookie(app);

    const res = await app.inject({
      method: "POST", url: "/api/admins/invite",
      headers: { cookie },
      payload: { email: "new-admin@test.com" },
    });
    expect(res.statusCode).toBe(403);
  });

  it("некоректна роль -> 400", async () => {
    const db = makeDb();
    const app = buildApp({ db });
    const cookie = await loginAndGetCookie(app);

    const res = await app.inject({
      method: "POST", url: "/api/admins/invite",
      headers: { cookie },
      payload: { email: "x@test.com", role: "hacker" },
    });
    expect(res.statusCode).toBe(400);
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

describe("PATCH /api/admins/:id/role", () => {
  it("superadmin змінює роль іншого адміна", async () => {
    const db = makeDb();
    await db.createAdmin({ email: "other@test.com", password: "x", role: "viewer" });
    const app = buildApp({ db });
    const cookie = await loginAndGetCookie(app);

    const res = await app.inject({
      method: "PATCH", url: "/api/admins/2/role",
      headers: { cookie },
      payload: { role: "admin" },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().admin.role).toBe("admin");
  });

  it("не можна понизити ОСТАННЬОГО superadmin (self-lockout protection)", async () => {
    const db = makeDb(); // лише admin@test.com, role=superadmin, єдиний
    const app = buildApp({ db });
    const cookie = await loginAndGetCookie(app);

    const res = await app.inject({
      method: "PATCH", url: "/api/admins/1/role",
      headers: { cookie },
      payload: { role: "admin" },
    });
    expect(res.statusCode).toBe(409);
  });

  it("можна понизити superadmin, якщо є ще хоча б один інший superadmin", async () => {
    const db = makeDb();
    await db.createAdmin({ email: "second-super@test.com", password: "x", role: "superadmin" });
    const app = buildApp({ db });
    const cookie = await loginAndGetCookie(app);

    const res = await app.inject({
      method: "PATCH", url: "/api/admins/1/role",
      headers: { cookie },
      payload: { role: "admin" },
    });
    expect(res.statusCode).toBe(200);
  });

  it("admin (не superadmin) отримує 403", async () => {
    const db = makeDb({ ownerRole: "admin" });
    await db.createAdmin({ email: "other@test.com", password: "x", role: "viewer" });
    const app = buildApp({ db });
    const cookie = await loginAndGetCookie(app);

    const res = await app.inject({
      method: "PATCH", url: "/api/admins/2/role",
      headers: { cookie },
      payload: { role: "admin" },
    });
    expect(res.statusCode).toBe(403);
  });

  it("некоректна роль -> 400", async () => {
    const app = buildApp({ db: makeDb() });
    const cookie = await loginAndGetCookie(app);

    const res = await app.inject({
      method: "PATCH", url: "/api/admins/1/role",
      headers: { cookie },
      payload: { role: "hacker" },
    });
    expect(res.statusCode).toBe(400);
  });

  it("невідомий id -> 404", async () => {
    const app = buildApp({ db: makeDb() });
    const cookie = await loginAndGetCookie(app);

    const res = await app.inject({
      method: "PATCH", url: "/api/admins/999/role",
      headers: { cookie },
      payload: { role: "admin" },
    });
    expect(res.statusCode).toBe(404);
  });
});

describe("GET+POST /api/invite/:token (прийняття запрошення, публічний шлях)", () => {
  it("повний цикл: invite(role=viewer) -> перевірка токена -> accept -> новий адмін логіниться з роллю viewer", async () => {
    const db = makeDb();
    const app = buildApp({ db });
    const cookie = await loginAndGetCookie(app);

    const inviteRes = await app.inject({
      method: "POST", url: "/api/admins/invite",
      headers: { cookie },
      payload: { email: "new-admin@test.com", role: "viewer" },
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

    const created = (await db.getAdmins()).find((a) => a.email === "new-admin@test.com");
    expect(created.role).toBe("viewer");

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
