import { writeFile } from "fs/promises";
import { join } from "path";
import { parseScenario } from "./parseScenario.js";
import { assertSafeName } from "./safeName.js";

export async function saveScenario(dir, name, raw) {
  assertSafeName(name);

  const parsed = parseScenario(raw);
  // Зберігаємо оригінальний raw (з users якщо є), а не розпарсений результат
  await writeFile(join(dir, `${name}.json`), JSON.stringify(raw, null, 2));

  return parsed.users
    ? { name, steps: parsed.steps, users: parsed.users }
    : { name, steps: parsed.steps };
}
