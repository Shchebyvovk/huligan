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
  it("оновлює статус рану", async () => {
    const pool = makePool([]);
    const db = createPgAdapter(pool);
    await db.updateRunStatus(1, "running");
    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining("test_runs"),
      [1, "running"]
    );
  });
});

describe("createRun", () => {
  it("вставляє і повертає новий ран", async () => {
    const run = { id: 1, scenario: { steps: [] }, concurrency: 10, status: "pending" };
    const pool = makePool([run]);
    const db = createPgAdapter(pool);
    const result = await db.createRun({ scenario: { steps: [] }, concurrency: 10 });
    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining("test_runs"),
      [{ steps: [] }, 10, "pending"]
    );
    expect(result).toEqual(run);
  });
});
