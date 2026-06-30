import { describe, it, expect } from "vitest";
import { buildApp } from "../index.js";

const db = {
  async findAdminByEmail() { return null; },
  async createSession() {},
  async findSession() { return null; },
  async deleteSession() {},
  async getRuns() { return []; },
  async createRun(data) { return { id: 1, ...data, status: "pending" }; },
};

describe("GET /health", () => {
  it("повертає 200 і ok: true", async () => {
    const app = buildApp({ db });
    const res = await app.inject({ method: "GET", url: "/health" });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ ok: true });
  });
});
