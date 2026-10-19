import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { buildApp } from "../index.js";

const db = {
  async findAdminByEmail() { return null; },
  async createSession() {},
  async findSession() { return null; },
  async deleteSession() {},
};

const ORIGINAL_ALLOWED = process.env.ALLOWED_ORIGINS;
const ORIGINAL_FRONTEND = process.env.FRONTEND_URL;

beforeEach(() => {
  process.env.ALLOWED_ORIGINS = "https://huligan-front.onrender.com";
  delete process.env.FRONTEND_URL;
});

afterEach(() => {
  if (ORIGINAL_ALLOWED === undefined) delete process.env.ALLOWED_ORIGINS; else process.env.ALLOWED_ORIGINS = ORIGINAL_ALLOWED;
  if (ORIGINAL_FRONTEND === undefined) delete process.env.FRONTEND_URL; else process.env.FRONTEND_URL = ORIGINAL_FRONTEND;
});

// Знайдено живим пентестом: origin:true відбивав БУДЬ-який Origin назад +
// credentials:true = будь-який сайт міг і слати, і ЧИТАТИ відповідь
// захищених роутів від імені залогіненого адміна. Тести нижче фіксують, що
// тепер дозволено лише explicit allowlist (ALLOWED_ORIGINS / FRONTEND_URL).
describe("CORS allowlist", () => {
  it("дозволений origin отримує Access-Control-Allow-Origin саме для себе", async () => {
    const app = buildApp({ db });
    const res = await app.inject({
      method: "GET", url: "/health",
      headers: { origin: "https://huligan-front.onrender.com" },
    });
    expect(res.headers["access-control-allow-origin"]).toBe("https://huligan-front.onrender.com");
  });

  it("сторонній origin НЕ отримує Access-Control-Allow-Origin (раніше відбивався будь-який)", async () => {
    const app = buildApp({ db });
    const res = await app.inject({
      method: "GET", url: "/health",
      headers: { origin: "https://attacker.example.com" },
    });
    expect(res.headers["access-control-allow-origin"]).not.toBe("https://attacker.example.com");
  });

  it("preflight (OPTIONS) для стороннього origin не дозволяє запит", async () => {
    const app = buildApp({ db });
    const res = await app.inject({
      method: "OPTIONS", url: "/api/runs",
      headers: {
        origin: "https://attacker.example.com",
        "access-control-request-method": "POST",
      },
    });
    expect(res.headers["access-control-allow-origin"]).not.toBe("https://attacker.example.com");
  });

  it("запит без Origin (не-браузерний виклик) не падає", async () => {
    const app = buildApp({ db });
    const res = await app.inject({ method: "GET", url: "/health" });
    expect(res.statusCode).toBe(200);
  });
});
