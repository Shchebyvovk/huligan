import { describe, it, expect, vi } from "vitest";
import { runScenario } from "../runScenario.js";

const makeClient = (overrides = {}) => ({
  login:       vi.fn().mockResolvedValue({ token: "tok" }),
  sendMessage: vi.fn().mockResolvedValue(undefined),
  logout:      vi.fn().mockResolvedValue(undefined),
  wait:        vi.fn().mockResolvedValue(undefined),
  ...overrides,
});

const STEPS = [
  { action: "login",        payload: { email: "u@test.com", password: "pass" } },
  { action: "send_message", payload: { text: "hi" } },
  { action: "wait",         payload: { ms: 100 } },
  { action: "logout" },
];

describe("runScenario", () => {
  it("виконує всі кроки по черзі", async () => {
    const client = makeClient();
    await runScenario(STEPS, client);

    expect(client.login).toHaveBeenCalledWith({ email: "u@test.com", password: "pass" });
    expect(client.sendMessage).toHaveBeenCalledWith({ text: "hi" });
    expect(client.wait).toHaveBeenCalledWith({ ms: 100 });
    expect(client.logout).toHaveBeenCalled();
  });

  it("повертає масив результатів кожного кроку", async () => {
    const client = makeClient();
    const results = await runScenario(STEPS, client);
    expect(results).toHaveLength(4);
  });

  it("кожен результат містить action і статус ok", async () => {
    const client = makeClient();
    const results = await runScenario(STEPS, client);
    expect(results.every(r => r.ok === true)).toBe(true);
    expect(results[0].action).toBe("login");
  });

  it("зупиняється і повертає error якщо крок кидає", async () => {
    const client = makeClient({
      login: vi.fn().mockRejectedValue(new Error("auth failed")),
    });
    const results = await runScenario(STEPS, client);
    expect(results[0].ok).toBe(false);
    expect(results[0].error).toBe("auth failed");
    expect(results).toHaveLength(1);
  });
});
