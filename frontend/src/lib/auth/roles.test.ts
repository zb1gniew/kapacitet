import { describe, expect, it } from "vitest";
import { isPlatformAdmin } from "./roles";

describe("isPlatformAdmin", () => {
  it("returns true for Admin and OperatorAdmin roles", () => {
    expect(isPlatformAdmin({ roles: ["Admin"] })).toBe(true);
    expect(isPlatformAdmin({ roles: ["OperatorAdmin"] })).toBe(true);
    expect(isPlatformAdmin({ roles: ["User", "Admin"] })).toBe(true);
  });

  it("returns false for non-admin roles", () => {
    expect(isPlatformAdmin({ roles: ["User"] })).toBe(false);
    expect(isPlatformAdmin({ roles: [] })).toBe(false);
  });

  it("returns false when the user is null or undefined", () => {
    expect(isPlatformAdmin(null)).toBe(false);
    expect(isPlatformAdmin(undefined)).toBe(false);
  });
});
