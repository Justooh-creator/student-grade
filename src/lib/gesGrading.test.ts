import { describe, expect, it } from "vitest";
import { gradeFor, parseScore } from "./ges";
import { computeStudentResult } from "./results";
import type { Student } from "./store";

const cases: [number, number][] = [
  [0, 9], [39, 9], [40, 8], [44, 8], [45, 7], [49, 7], [50, 6], [54, 6], [55, 5], [59, 5],
  [60, 4], [64, 4], [65, 3], [69, 3], [70, 2], [79, 2], [80, 1], [99, 1], [100, 1],
];

describe("GES grade boundaries", () => {
  it.each(cases)("score %d → grade %d", (score, grade) => expect(gradeFor(score).grade).toBe(grade));
  it.each([100.5, 101, 105, -1, -10, NaN, Infinity, -Infinity])("rejects total %s", (v) => {
    expect(() => gradeFor(v)).toThrow(RangeError);
  });
});

describe("mark entry validation", () => {
  it("empty input is not entered", () => expect(parseScore("", 100)).toEqual({ ok: true, value: null }));
  it("keeps decimals", () => expect(parseScore("45.5", 100)).toEqual({ ok: true, value: 45.5 }));
  it.each(["abc", "12a", "-1", "-10", "100.5", "101", "105", "NaN", "Infinity", NaN, Infinity, -Infinity])("rejects %s", (v) => {
    const r = parseScore(v, 100);
    expect(r.ok).toBe(false);
  });
  it("message names the range", () => {
    const r = parseScore("25", 20);
    expect(r.ok === false && r.message).toContain("0–20");
  });
});

describe("result calculation never grades invalid totals as 9", () => {
  it("over-100 total is flagged, not Fail", () => {
    const s: Student = { id: "x", name: "T", admissionNo: "", classId: "b4", attendance: "", conduct: "", interest: "", remark: "",
      scores: { "English Language": { sba: 55, exam: 50 } } };
    const row = computeStudentResult(s).subjects.find((r) => r.subject === "English Language")!;
    expect(row.grade).toBeNull();
    expect(row.remark).toContain("Invalid");
  });
});
