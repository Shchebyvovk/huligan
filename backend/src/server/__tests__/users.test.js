import { describe, it, expect } from "vitest";
import { buildApp } from "../index.js";
import { hashPassword } from "../../auth/hashPassword.js";

const makeDb = ({ role = "admin" } = {}) => {
  const sessions = {};
  return {
    async findAdminByEmail(email) {
      return email === "admin@test.com" ? { id: 1, password: await hashPassword("secret"), role } : null;
    },
    async findAdminById(id) {
      return id === 1 ? { id: 1, email: "admin@test.com", role } : null;
    },
    async createSession({ token, userId, expiresAt }) { sessions[token] = { userId, expiresAt }; },
    async findSession(token) { return sessions[token] ?? null; },
    async deleteSession(token) { delete sessions[token]; },
    async insertUsers() {},
  };
};

const loginAndGetCookie = async (app) => {
  const res = await app.inject({
    method: "POST", url: "/api/auth/login",
    payload: { email: "admin@test.com", password: "secret" },
  });
  return res.headers["set-cookie"];
};

describe("POST /api/users/generate", () => {
  it("admin може згенерувати юзерів", async () => {
    const app = buildApp({ db: makeDb() });
    const cookie = await loginAndGetCookie(app);

    const res = await app.inject({
      method: "POST", url: "/api/users/generate",
      headers: { cookie },
      payload: { count: 10 },
    });
    expect(res.statusCode).toBe(201);
  });

  it("viewer отримує 403", async () => {
    const app = buildApp({ db: makeDb({ role: "viewer" }) });
    const cookie = await loginAndGetCookie(app);

    const res = await app.inject({
      method: "POST", url: "/api/users/generate",
      headers: { cookie },
      payload: { count: 10 },
    });
    expect(res.statusCode).toBe(403);
  });
});
