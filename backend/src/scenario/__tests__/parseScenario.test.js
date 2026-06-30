import { describe, it, expect } from "vitest";
import { parseScenario } from "../parseScenario.js";

const VALID = [
  { action: "login",        payload: { email: "u@test.com", password: "pass" } },
  { action: "send_message", payload: { text: "hello" } },
  { action: "wait",         payload: { ms: 500 } },
  { action: "logout" },
];

describe("parseScenario — валідні сценарії", () => {
  it("повертає масив кроків для коректного сценарію", () => {
    expect(parseScenario(VALID)).toHaveLength(4);
  });

  it("крок без payload (logout) проходить валідацію", () => {
    const steps = parseScenario([{ action: "logout" }]);
    expect(steps[0]).toEqual({ action: "logout" });
  });
});

describe("parseScenario — структурні помилки", () => {
  it("кидає якщо вхід не масив", () => {
    expect(() => parseScenario({ action: "login" })).toThrow("must be an array");
  });

  it("кидає якщо масив порожній", () => {
    expect(() => parseScenario([])).toThrow("empty");
  });

  it("кидає якщо крок не має поля action", () => {
    expect(() => parseScenario([{ payload: {} }])).toThrow("action");
  });

  it("кидає для невідомого action", () => {
    expect(() => parseScenario([{ action: "hack" }])).toThrow("unknown action");
  });
});

describe("parseScenario — валідація payload", () => {
  it("кидає якщо login не має email", () => {
    expect(() =>
      parseScenario([{ action: "login", payload: { password: "x" } }])
    ).toThrow("login");
  });

  it("кидає якщо send_message не має text", () => {
    expect(() =>
      parseScenario([{ action: "send_message", payload: {} }])
    ).toThrow("send_message");
  });

  it("кидає якщо wait.ms не є числом", () => {
    expect(() =>
      parseScenario([{ action: "wait", payload: { ms: "500" } }])
    ).toThrow("wait");
  });
});
