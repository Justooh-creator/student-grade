import { describe, expect, it } from "vitest";
import { nextAcademicYear, rolloverStudents, rolloverSummary } from "./promotion";
import type { Student } from "./store";

const s = (id: string, classId: Student["classId"], promotion?: "promoted" | "retained" | "tbd"): Student => ({
  id, name: id, admissionNo: "A1", classId, attendance: "50", conduct: "Good", interest: "Reading", remark: "Nice",
  scores: { Mathematics: { sba: 40, exam: 40 } }, parentPhone: "0240000000", ...(promotion ? { promotion: promotion as "promoted" } : {}),
});

describe("term 3 rollover", () => {
  it("promoted learner moves to the next class", () => {
    expect(rolloverStudents([s("a", "b4", "promoted")])[0]!.classId).toBe("b5");
  });
  it("KG 2 promoted goes to Basic 1", () => {
    expect(rolloverStudents([s("a", "kg2", "promoted")])[0]!.classId).toBe("b1");
  });
  it("retained learner stays in the same class", () => {
    expect(rolloverStudents([s("a", "b3", "retained")])[0]!.classId).toBe("b3");
  });
  it("promoted Basic 9 leaves the register", () => {
    expect(rolloverStudents([s("a", "b9", "promoted")])).toHaveLength(0);
  });
  it("scores and attendance reset, name and parent phone kept", () => {
    const r = rolloverStudents([s("a", "b1", "promoted")])[0]!;
    expect(r.scores).toEqual({});
    expect(r.attendance).toBe("");
    expect(r.parentPhone).toBe("0240000000");
    expect(r.name).toBe("a");
  });
  it("blocks when a learner is undecided", () => {
    expect(() => rolloverStudents([s("a", "b1", "tbd")])).toThrow();
    expect(rolloverSummary([s("a", "b1")]).undecided).toHaveLength(1);
  });
  it("academic year advances by one", () => {
    expect(nextAcademicYear("2025/2026")).toBe("2026/2027");
  });
});

describe("stream promotion", () => {
  it("keeps the stream when moving up", () => {
    expect(nextClassId("b1a")).toBe("b2a");
    expect(nextClassId("kg2b")).toBe("b1b");
    expect(nextClassId("b9c")).toBeNull();
  });
});
