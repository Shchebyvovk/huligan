import { writeFile } from "fs/promises";
import { join } from "path";
import { parseScenario } from "./parseScenario.js";
import { assertSafeName } from "./safeName.js";

export async function saveScenario(dir, name, rawSteps) {
  assertSafeName(name);

  const steps = parseScenario(rawSteps);
  await writeFile(join(dir, `${name}.json`), JSON.stringify(steps, null, 2));

  return { name, steps };
}
