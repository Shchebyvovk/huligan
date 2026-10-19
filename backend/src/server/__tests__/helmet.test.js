import { describe, it, expect } from "vitest";
import { buildApp } from "../index.js";

const db = {
  async findAdminByEmail() { return null; },
  async createSession() {},
  async findSession() { return null; },
  async deleteSession() {},
};

describe("security headers (@fastify/helmet)", () => {
  it("відповіді несуть базові security-заголовки", async () => {
    const app = buildApp({ db });
    const res = await app.inject({ method: "GET", url: "/health" });
    expect(res.headers["x-content-type-options"]).toBe("nosniff");
    expect(res.headers["x-dns-prefetch-control"]).toBeDefined();
    expect(res.headers["x-powered-by"]).toBeUndefined();
  });

  // helmet's default Cross-Origin-Resource-Policy is "same-origin", which
  // would silently break the legitimate cross-origin fetches this app
  // depends on in production (frontend and backend are separate Render
  // domains, already explicitly allowed via the CORS allowlist).
  it("crossOriginResourcePolicy дозволяє cross-origin (не дефолтний same-origin)", async () => {
    const app = buildApp({ db });
    const res = await app.inject({ method: "GET", url: "/health" });
    expect(res.headers["cross-origin-resource-policy"]).toBe("cross-origin");
  });
});
