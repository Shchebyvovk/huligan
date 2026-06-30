import { describe, it, expect } from "vitest";
import { parseScenario } from "../parseScenario.js";

const VALID_ARRAY = [
  { action: "login",        payload: { email: "u@test.com", password: "pass" } },
  { action: "send_message", payload: { text: "hello" } },
  { action: "wait",         payload: { ms: 500 } },
  { action: "logout" },
];

const VALID_OBJECT = {
  users: [{ email: "u@test.com", password: "pass" }],
  steps: [
    { action: "login" },
    { action: "send_message", payload: { text: "hello" } },
    { action: "logout" },
  ],
};

describe("parseScenario — масив (старий формат)", () => {
  it("повертає { steps } для коректного сценарію", () => {
    const result = parseScenario(VALID_ARRAY);
    expect(result.steps).toHaveLength(4);
    expect(result.users).toBeUndefined();
  });

  it("крок без payload (logout) проходить валідацію", () => {
    const { steps } = parseScenario([{ action: "logout" }]);
    expect(steps[0]).toEqual({ action: "logout" });
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

describe("parseScenario — об'єкт з пулом юзерів", () => {
  it("повертає { steps, users } для коректного сценарію", () => {
    const result = parseScenario(VALID_OBJECT);
    expect(result.steps).toHaveLength(3);
    expect(result.users).toHaveLength(1);
    expect(result.users[0]).toEqual({ email: "u@test.com", password: "pass" });
  });

  it("login без payload дозволений коли є пул юзерів", () => {
    expect(() => parseScenario(VALID_OBJECT)).not.toThrow();
  });

  it("кидає якщо users порожній масив", () => {
    expect(() => parseScenario({ users: [], steps: VALID_OBJECT.steps })).toThrow("non-empty");
  });

  it("кидає якщо юзер без email", () => {
    expect(() =>
      parseScenario({ users: [{ password: "x" }], steps: VALID_OBJECT.steps })
    ).toThrow("email");
  });

  it("кидає якщо немає steps", () => {
    expect(() => parseScenario({ users: VALID_OBJECT.users })).toThrow("steps");
  });

  it("кидає якщо вхід — рядок", () => {
    expect(() => parseScenario("bad")).toThrow();
  });
});
