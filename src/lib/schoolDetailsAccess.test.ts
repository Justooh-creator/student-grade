import { describe, expect, it } from "vitest";
import { canEditSchoolDetails } from "./schoolDetailsAccess";

describe("School Details permissions", () => {
  it("does not allow ordinary teachers to change School Details", () => {
    expect(canEditSchoolDetails("teacher")).toBe(false);
  });
  it("allows headteachers", () => {
    expect(canEditSchoolDetails("headteacher")).toBe(true);
  });
  it("allows admins", () => {
    expect(canEditSchoolDetails("admin")).toBe(true);
    expect(canEditSchoolDetails("teacher", true)).toBe(true);
  });
  it("denies access while privileges are unknown or no school role exists", () => {
    expect(canEditSchoolDetails()).toBe(false);
  });
});