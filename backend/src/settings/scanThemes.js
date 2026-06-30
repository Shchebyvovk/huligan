import { readdir } from "fs/promises";

export async function scanThemes(dir) {
  const files = await readdir(dir).catch(() => []);
  return files.filter(f => f.endsWith(".json")).map(f => f.slice(0, -5));
}
