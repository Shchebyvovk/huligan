import { describe, it, expect } from "vitest";
import { join } from "path";
import { scanScenarios } from "../scanScenarios.js";

const FIXTURES = join(import.meta.dirname, "fixtures/scenarios");

describe("scanScenarios", () => {
  it("повертає валідні сценарії з name і steps", async () => {
    const scenarios = await scanScenarios(FIXTURES);
    const chatFlood = scenarios.find(s => s.name === "chat-flood");
    expect(chatFlood).toBeDefined();
    expect(chatFlood.steps).toHaveLength(4);
  });

  it("пропускає файли, що не проходять валідацію DSL", async () => {
    const scenarios = await scanScenarios(FIXTURES);
    expect(scenarios.find(s => s.name === "broken")).toBeUndefined();
  });

  it("ігнорує файли не з розширенням .json", async () => {
    const scenarios = await scanScenarios(FIXTURES);
    expect(scenarios.find(s => s.name === "README")).toBeUndefined();
  });

  it("повертає порожній масив для неіснуючої директорії", async () => {
    expect(await scanScenarios(join(FIXTURES, "missing"))).toEqual([]);
  });
});
