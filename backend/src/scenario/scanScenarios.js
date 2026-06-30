import { readdir, readFile, stat } from "fs/promises";
import { join } from "path";
import { parseScenario } from "./parseScenario.js";

const MAX_SCENARIOS = 10;

export async function scanScenarios(dir) {
  const files = await readdir(dir).catch(() => []);
  const jsonFiles = files.filter(f => f.endsWith(".json"));

  const scenarios = await Promise.all(
    jsonFiles.map(async f => {
      const path = join(dir, f);
      try {
        const [raw, { mtimeMs }] = await Promise.all([
          readFile(path, "utf-8"),
          stat(path),
        ]);
        return { name: f.slice(0, -5), steps: parseScenario(JSON.parse(raw)), mtimeMs };
      } catch {
        return null;
      }
    })
  );

  return scenarios
    .filter(Boolean)
    .sort((a, b) => b.mtimeMs - a.mtimeMs)
    .slice(0, MAX_SCENARIOS)
    .map(({ name, steps }) => ({ name, steps }));
}
