import { describe, expect, it } from "vitest";
import { appendLearnerImport, parseLearnerRows, planLearnerImport, type LearnerImportRow } from "./studentImport";
import type { Student } from "./store";

const learner = (i: number, classId: Student["classId"] = "b1a"): Student => ({ id: String(i), name: `Learner ${i}`, admissionNo: String(i), classId, scores: {}, attendance: "", conduct: "", interest: "", remark: "" });
const row: LearnerImportRow = { row: 2, name: "New Learner", admissionNo: "N1", gender: "Female" };
describe("learner register import", () => {
  it("allows the 35th learner but rejects a 36th without changing records", () => {
    const current = Array.from({ length: 34 }, (_, i) => learner(i));
    const filled = appendLearnerImport(current, [row], "b1a", true);
    expect(filled).toHaveLength(35);
    expect(() => appendLearnerImport(filled, [{ ...row, name: "Another", admissionNo: "N2" }], "b1a", true)).toThrow("35 maximum");
    expect(current).toHaveLength(34);
  });
  it("denies import into a view-only class", () => {
    expect(() => appendLearnerImport([], [row], "b1a", false)).toThrow("view only");
  });
  it("skips duplicate names and admission numbers without overwriting marks", () => {
    const existing = { ...learner(1), scores: { Mathematics: { sba: 40, exam: 45 } } };
    const incoming = [{ ...row, name: " learner  1 ", admissionNo: "other" }, { ...row, name: "Other", admissionNo: "1" }, row, row];
    const imported = appendLearnerImport([existing], incoming, "b1a", true);
    expect(imported).toHaveLength(2);
    expect(imported[0]?.scores["Mathematics"]).toEqual({ sba: 40, exam: 45 });
  });
  it("counts capacity and duplicates within the exact stream", () => {
    const otherStream = Array.from({ length: 35 }, (_, i) => learner(i, "b1b"));
    expect(planLearnerImport([row], otherStream, "b1a").remaining).toBe(35);
    expect(appendLearnerImport(otherStream, [row], "b1a", true).at(-1)?.classId).toBe("b1a");
  });
  it("imports names, admission numbers and optional gender but no scores", () => {
    const parsed = parseLearnerRows([["Name", "Admission Number", "Gender", "Exam"], [" Ama ", "001", "F", 100]]);
    expect(parsed.rows[0]).toEqual({ row: 2, name: "Ama", admissionNo: "001", gender: "Female" });
    const imported = appendLearnerImport([], parsed.rows, "kg1", true);
    expect(imported[0]?.scores).toEqual({});
    expect(imported[0]?.gender).toBe("Female");
  });
});