import { writeFile } from "fs/promises";
import { join } from "path";
import { parseScenario } from "./parseScenario.js";

const SAFE_NAME = /^[a-zA-Z0-9_-]+$/;

export async function saveScenario(dir, name, rawSteps) {
  if (!SAFE_NAME.test(name)) {
    throw new Error("name must contain only letters, digits, - and _");
  }

  const steps = parseScenario(rawSteps);
  await writeFile(join(dir, `${name}.json`), JSON.stringify(steps, null, 2));

  return { name, steps };
}
