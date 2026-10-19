import { describe, it, expect, vi } from "vitest";
import { createPgAdapter } from "../pgAdapter.js";

const makePool = (rows = []) => ({
  query: vi.fn().mockResolvedValue({ rows }),
});

describe("findAdminByEmail", () => {
  it("повертає юзера з admin_users", async () => {
    const pool = makePool([{ id: 1, password: "hash" }]);
    const db = createPgAdapter(pool);
    const result = await db.findAdminByEmail("admin@test.com");
    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining("admin_users"),
      ["admin@test.com"]
    );
    expect(result).toEqual({ id: 1, password: "hash" });
  });

  it("повертає null якщо юзера немає", async () => {
    const pool = makePool([]);
    const db = createPgAdapter(pool);
    expect(await db.findAdminByEmail("x@x.com")).toBeNull();
  });
});

describe("findAdminById", () => {
  it("повертає id/email/role з admin_users", async () => {
    const pool = makePool([{ id: 1, email: "a@test.com", role: "admin" }]);
    const db = createPgAdapter(pool);
    const result = await db.findAdminById(1);
    expect(pool.query).toHaveBeenCalledWith(expect.stringContaining("admin_users"), [1]);
    expect(result).toEqual({ id: 1, email: "a@test.com", role: "admin" });
  });

  it("повертає null якщо адміна немає", async () => {
    const pool = makePool([]);
    const db = createPgAdapter(pool);
    expect(await db.findAdminById(999)).toBeNull();
  });
});

describe("countSuperadmins", () => {
  it("повертає кількість адмінів з роллю superadmin", async () => {
    const pool = makePool([{ count: 2 }]);
    const db = createPgAdapter(pool);
    expect(await db.countSuperadmins()).toBe(2);
    expect(pool.query).toHaveBeenCalledWith(expect.stringContaining("superadmin"));
  });
});

describe("updateAdminRole", () => {
  it("оновлює роль і повертає оновлений рядок", async () => {
    const pool = makePool([{ id: 2, email: "b@test.com", role: "viewer", createdAt: new Date() }]);
    const db = createPgAdapter(pool);
    const result = await db.updateAdminRole(2, "viewer");
    expect(pool.query).toHaveBeenCalledWith(expect.stringContaining("UPDATE admin_users"), [2, "viewer"]);
    expect(result.role).toBe("viewer");
  });
});

describe("createSession", () => {
  it("вставляє рядок у sessions", async () => {
    const pool = makePool([]);
    const db = createPgAdapter(pool);
    const expiresAt = new Date("2030-01-01");
    await db.createSession({ token: "tok123", userId: 5, expiresAt });
    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining("sessions"),
      ["tok123", 5, expiresAt]
    );
  });
});

describe("findSession", () => {
  it("повертає userId та expiresAt", async () => {
    const expiresAt = new Date("2030-01-01");
    const pool = makePool([{ userId: 5, expiresAt }]);
    const db = createPgAdapter(pool);
    expect(await db.findSession("tok123")).toEqual({ userId: 5, expiresAt });
  });

  it("повертає null якщо сесії немає", async () => {
    const pool = makePool([]);
    const db = createPgAdapter(pool);
    expect(await db.findSession("tok123")).toBeNull();
  });
});

describe("deleteSession", () => {
  it("видаляє з sessions за токеном", async () => {
    const pool = makePool([]);
    const db = createPgAdapter(pool);
    await db.deleteSession("tok123");
    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining("DELETE"),
      ["tok123"]
    );
  });
});

describe("getRuns", () => {
  it("повертає масив ранів", async () => {
    const rows = [{ id: 1, scenario: { steps: [] }, concurrency: 5, status: "pending" }];
    const pool = makePool(rows);
    const db = createPgAdapter(pool);
    expect(await db.getRuns()).toEqual(rows);
    expect(pool.query).toHaveBeenCalledWith(expect.stringContaining("test_runs"));
  });
});

describe("updateRunStatus", () => {
  it("оновлює статус рану без results", async () => {
    const pool = makePool([]);
    const db = createPgAdapter(pool);
    await db.updateRunStatus(1, "running");
    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining("test_runs"),
      [1, "running", null]
    );
  });

  it("оновлює статус рану з results", async () => {
    const pool = makePool([]);
    const db = createPgAdapter(pool);
    const results = { total: 10, passed: 9, failed: 1, steps: {} };
    await db.updateRunStatus(1, "completed", results);
    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining("test_runs"),
      [1, "completed", JSON.stringify(results)]
    );
  });
});

describe("createRun", () => {
  it("вставляє і повертає новий ран", async () => {
    const run = { id: 1, scenario: { steps: [] }, concurrency: 10, status: "pending" };
    const pool = makePool([run]);
    const db = createPgAdapter(pool);
    const result = await db.createRun({ scenario: { steps: [] }, concurrency: 10, targetUrl: 'https://t.com' });
    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining("test_runs"),
      [{ steps: [] }, 10, 'https://t.com', null, 0, "pending"]
    );
    expect(result).toEqual(run);
  });
});
