import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm, readFile } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { saveScenario } from "../saveScenario.js";

let dir;

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), "huligan-scenarios-"));
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

const STEPS = [
  { action: "login", payload: { email: "u@test.com", password: "pass" } },
  { action: "logout" },
];

describe("saveScenario", () => {
  it("записує валідний сценарій у файл <name>.json", async () => {
    const saved = await saveScenario(dir, "my-scenario", STEPS);
    expect(saved).toEqual({ name: "my-scenario", steps: STEPS });

    const fileContent = JSON.parse(await readFile(join(dir, "my-scenario.json"), "utf-8"));
    expect(fileContent).toEqual(STEPS);
  });

  it("кидає помилку для невалідного DSL і нічого не записує", async () => {
    await expect(saveScenario(dir, "bad", [{ action: "hack" }])).rejects.toThrow("unknown action");
  });

  it("кидає помилку для небезпечної назви файлу", async () => {
    await expect(saveScenario(dir, "../evil", STEPS)).rejects.toThrow("name");
  });

  it("кидає помилку для порожньої назви", async () => {
    await expect(saveScenario(dir, "", STEPS)).rejects.toThrow("name");
  });
});
