import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { join } from "path";
import { mkdtemp, rm, writeFile, utimes } from "fs/promises";
import { tmpdir } from "os";
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

describe("scanScenarios — ліміт і сортування", () => {
  let dir;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "huligan-scan-scenarios-"));
    for (let i = 0; i < 12; i++) {
      const file = join(dir, `s${i}.json`);
      await writeFile(file, JSON.stringify([{ action: "logout" }]));
      await utimes(file, new Date(2000 + i, 0, 1), new Date(2000 + i, 0, 1));
    }
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it("повертає не більше 10 останніх за часом модифікації сценаріїв", async () => {
    const scenarios = await scanScenarios(dir);
    expect(scenarios).toHaveLength(10);
  });

  it("сортує від найновіших до найстаріших", async () => {
    const scenarios = await scanScenarios(dir);
    expect(scenarios.map(s => s.name)).toEqual([
      "s11", "s10", "s9", "s8", "s7", "s6", "s5", "s4", "s3", "s2",
    ]);
  });
});
