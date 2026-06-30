import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm, writeFile, access } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { deleteScenario } from "../deleteScenario.js";

let dir;

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), "huligan-delete-scenario-"));
  await writeFile(join(dir, "my-scenario.json"), JSON.stringify([{ action: "logout" }]));
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

describe("deleteScenario", () => {
  it("видаляє файл сценарію", async () => {
    await deleteScenario(dir, "my-scenario");
    await expect(access(join(dir, "my-scenario.json"))).rejects.toThrow();
  });

  it("кидає помилку для небезпечної назви", async () => {
    await expect(deleteScenario(dir, "../evil")).rejects.toThrow("name");
  });

  it("не падає, якщо файл вже не існує", async () => {
    await expect(deleteScenario(dir, "missing")).resolves.toBeUndefined();
  });
});
