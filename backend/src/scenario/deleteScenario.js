import { unlink } from "fs/promises";
import { join } from "path";
import { assertSafeName } from "./safeName.js";

export async function deleteScenario(dir, name) {
  assertSafeName(name);

  await unlink(join(dir, `${name}.json`)).catch(err => {
    if (err.code !== "ENOENT") throw err;
  });
}
