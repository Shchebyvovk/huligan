import { describe, it, expect } from "vitest";
import { roleAtLeast, isValidRole, ROLES } from "../roles.js";

describe("isValidRole", () => {
  it.each(ROLES)("%s є валідною роллю", (role) => {
    expect(isValidRole(role)).toBe(true);
  });

  it("невідома роль -> false", () => {
    expect(isValidRole("hacker")).toBe(false);
    expect(isValidRole(undefined)).toBe(false);
  });
});

describe("roleAtLeast", () => {
  it("viewer не проходить min=admin", () => {
    expect(roleAtLeast("viewer", "admin")).toBe(false);
  });

  it("admin проходить min=admin і min=viewer, не проходить min=superadmin", () => {
    expect(roleAtLeast("admin", "admin")).toBe(true);
    expect(roleAtLeast("admin", "viewer")).toBe(true);
    expect(roleAtLeast("admin", "superadmin")).toBe(false);
  });

  it("superadmin проходить будь-який мінімум", () => {
    expect(roleAtLeast("superadmin", "viewer")).toBe(true);
    expect(roleAtLeast("superadmin", "admin")).toBe(true);
    expect(roleAtLeast("superadmin", "superadmin")).toBe(true);
  });

  it("невідома/відсутня роль -> fail closed (false), а не крашиться", () => {
    expect(roleAtLeast(undefined, "viewer")).toBe(false);
    expect(roleAtLeast(null, "viewer")).toBe(false);
    expect(roleAtLeast("bogus", "viewer")).toBe(false);
  });
});
