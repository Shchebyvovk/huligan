import { readdir, readFile } from "fs/promises";
import { join } from "path";
import { parseScenario } from "./parseScenario.js";

export async function scanScenarios(dir) {
  const files = await readdir(dir).catch(() => []);
  const jsonFiles = files.filter(f => f.endsWith(".json"));

  const scenarios = await Promise.all(
    jsonFiles.map(async f => {
      const name = f.slice(0, -5);
      try {
        const raw = JSON.parse(await readFile(join(dir, f), "utf-8"));
        return { name, steps: parseScenario(raw) };
      } catch {
        return null;
      }
    })
  );

  return scenarios.filter(Boolean);
}
