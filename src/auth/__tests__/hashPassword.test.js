import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "../hashPassword.js";

describe("hashPassword", () => {
  it("повертає рядок у форматі salt:hash", async () => {
    const hash = await hashPassword("secret");
    expect(hash).toMatch(/^[a-f0-9]+:[a-f0-9]+$/);
  });

  it("однаковий пароль дає різні хеші (унікальна сіль)", async () => {
    const h1 = await hashPassword("secret");
    const h2 = await hashPassword("secret");
    expect(h1).not.toBe(h2);
  });
});

describe("verifyPassword", () => {
  it("повертає true для правильного пароля", async () => {
    const hash = await hashPassword("correct-horse");
    expect(await verifyPassword("correct-horse", hash)).toBe(true);
  });

  it("повертає false для неправильного пароля", async () => {
    const hash = await hashPassword("correct-horse");
    expect(await verifyPassword("wrong-password", hash)).toBe(false);
  });

  it("повертає false для підробленого хешу", async () => {
    const hash = await hashPassword("secret");
    const [salt] = hash.split(":");
    const tampered = `${salt}:${"0".repeat(128)}`;
    expect(await verifyPassword("secret", tampered)).toBe(false);
  });
});
