import { describe, it, expect } from "vitest";
import { mergeSettings } from "../mergeSettings.js";

describe("mergeSettings", () => {
  const defaults = { theme: "huligan-dark", language: "uk", notifications: true };

  it("повертає дефолти, якщо у юзера немає власних налаштувань", () => {
    const result = mergeSettings(defaults, {});
    expect(result).toEqual(defaults);
  });

  it("перекриває дефолт значенням юзера, якщо воно є", () => {
    const userSettings = { theme: "midnight" };
    const result = mergeSettings(defaults, userSettings);
    expect(result.theme).toBe("midnight");
    expect(result.language).toBe("uk"); // не зачепили
  });

  it("ігнорує поля юзера, яких немає у дефолтах (захист від сміття в БД)", () => {
    const userSettings = { theme: "midnight", unknownField: "hack" };
    const result = mergeSettings(defaults, userSettings);
    expect(result.unknownField).toBeUndefined();
  });

  it("не падає, якщо userSettings є null (новий юзер)", () => {
    const result = mergeSettings(defaults, null);
    expect(result).toEqual(defaults);
  });
});
