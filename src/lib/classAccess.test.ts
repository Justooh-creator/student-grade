import { describe, expect, it } from "vitest";
import { canEditClass } from "./classAccess";

const a = { b4: ["t1"], b5: ["t1", "t2"] };

describe("canEditClass", () => {
  it("assigned teacher can edit their class", () => {
    expect(canEditClass({ inSchool: true, role: "teacher", userId: "t1", assignments: a, classId: "b4" })).toBe(true);
  });
  it("unassigned teacher is view-only", () => {
    expect(canEditClass({ inSchool: true, role: "teacher", userId: "t2", assignments: a, classId: "b4" })).toBe(false);
  });
  it("multiple teachers can share a class", () => {
    expect(canEditClass({ inSchool: true, role: "teacher", userId: "t2", assignments: a, classId: "b5" })).toBe(true);
  });
  it("headteacher edits every class", () => {
    expect(canEditClass({ inSchool: true, role: "headteacher", userId: "h", assignments: a, classId: "b4" })).toBe(true);
  });
  it("class with nobody assigned stays open", () => {
    expect(canEditClass({ inSchool: true, role: "teacher", userId: "t2", assignments: a, classId: "kg1" })).toBe(true);
  });
  it("independent teacher always edits", () => {
    expect(canEditClass({ inSchool: false, classId: "b4", assignments: a, userId: "x" })).toBe(true);
  });
});
