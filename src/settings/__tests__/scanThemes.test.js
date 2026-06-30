import { describe, it, expect } from "vitest";
import { join } from "path";
import { scanThemes } from "../scanThemes.js";

const FIXTURES = join(import.meta.dirname, "fixtures/themes");

describe("scanThemes", () => {
  it("повертає назви тем без розширення .json", async () => {
    const themes = await scanThemes(FIXTURES);
    expect(themes).toEqual(expect.arrayContaining(["huligan-dark", "midnight", "light"]));
  });

  it("ігнорує файли не з розширенням .json", async () => {
    const themes = await scanThemes(FIXTURES);
    expect(themes).not.toContain("README");
  });

  it("повертає порожній масив для порожньої директорії", async () => {
    const themes = await scanThemes(join(import.meta.dirname, "fixtures/empty"));
    expect(themes).toEqual([]);
  });
});
