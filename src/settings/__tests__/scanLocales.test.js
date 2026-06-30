import { describe, it, expect } from "vitest";
import { join } from "path";
import { scanLocales } from "../scanLocales.js";

const FIXTURES = join(import.meta.dirname, "fixtures/locales");

describe("scanLocales", () => {
  it("повертає коди локалей без розширення .json", async () => {
    const locales = await scanLocales(FIXTURES);
    expect(locales).toEqual(expect.arrayContaining(["uk", "en"]));
  });

  it("повертає порожній масив для порожньої директорії", async () => {
    const locales = await scanLocales(join(import.meta.dirname, "fixtures/empty"));
    expect(locales).toEqual([]);
  });
});
