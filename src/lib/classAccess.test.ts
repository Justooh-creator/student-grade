import { describe, expect, it } from "vitest";
import { canEditClass, canEditSubject } from "./classAccess";

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

const jhsSubs = { b7: { Mathematics: ["t1"], "English Language": ["t2"] } };

describe("canEditClass — Basic 7–9 subject assignment", () => {
  it("a subject teacher can open the class", () => {
    expect(canEditClass({ inSchool: true, role: "teacher", userId: "t1", subjectAssignments: jhsSubs, classId: "b7" })).toBe(true);
  });
  it("a teacher with no subject in that class is view-only", () => {
    expect(canEditClass({ inSchool: true, role: "teacher", userId: "t3", subjectAssignments: jhsSubs, classId: "b7" })).toBe(false);
  });
  it("the assigned class teacher can open the class", () => {
    expect(canEditClass({ inSchool: true, role: "teacher", userId: "ct", assignments: { b7: ["ct"] }, subjectAssignments: jhsSubs, classId: "b7" })).toBe(true);
  });
  it("JHS class with no subject assignments stays open", () => {
    expect(canEditClass({ inSchool: true, role: "teacher", userId: "t3", classId: "b8" })).toBe(true);
  });
});

describe("canEditSubject — Basic 7–9", () => {
  const base = { inSchool: true, role: "teacher", subjectAssignments: jhsSubs, classId: "b7" };
  it("subject teacher edits their own subject", () => {
    expect(canEditSubject({ ...base, userId: "t1", subject: "Mathematics" })).toBe(true);
  });
  it("subject teacher cannot edit another teacher's subject", () => {
    expect(canEditSubject({ ...base, userId: "t1", subject: "English Language" })).toBe(false);
  });
  it("unassigned subject stays locked for everyone but the class teacher", () => {
    expect(canEditSubject({ ...base, userId: "t1", subject: "French" })).toBe(false);
    expect(canEditSubject({ ...base, userId: "ct", assignments: { b7: ["ct"] }, subject: "French" })).toBe(true);
  });
  it("headteacher edits every subject", () => {
    expect(canEditSubject({ ...base, role: "headteacher", userId: "h", subject: "French" })).toBe(true);
  });
  it("KG–Basic 6 ignore subject assignments and follow the class rule", () => {
    expect(canEditSubject({ inSchool: true, role: "teacher", userId: "t1", assignments: a, classId: "b4", subject: "Mathematics" })).toBe(true);
    expect(canEditSubject({ inSchool: true, role: "teacher", userId: "t2", assignments: a, classId: "b4", subject: "Mathematics" })).toBe(false);
  });
  it("independent teacher edits every subject", () => {
    expect(canEditSubject({ inSchool: false, userId: "x", classId: "b7", subject: "Mathematics" })).toBe(true);
  });
});
