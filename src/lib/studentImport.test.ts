import { describe, expect, it } from "vitest";
import { appendLearnerImport, parseDob, parseLearnerRows, planLearnerImport, type LearnerImportRow } from "./studentImport";
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
  it("reads a Date of Birth column day-first and saves it on the learner", () => {
    const parsed = parseLearnerRows([["Name", "Admission Number", "Gender", "Date of Birth"], ["Ama", "001", "F", "14/05/2019"], ["Kofi", "002", "M", ""], ["Esi", "003", "F", "31/02/2019"]]);
    expect(parsed.rows[0]?.dob).toBe("2019-05-14");
    expect(parsed.rows[1]).not.toHaveProperty("dob");
    expect(parsed.rows[2]).not.toHaveProperty("dob");
    expect(parsed.notes).toHaveLength(1);
    expect(appendLearnerImport([], parsed.rows, "kg1", true)[0]?.dob).toBe("2019-05-14");
  });
  it("accepts the common register date formats", () => {
    const today = new Date("2026-11-20T00:00:00Z");
    expect(parseDob("2018-11-29", today)).toBe("2018-11-29");
    expect(parseDob("3-7-2019", today)).toBe("2019-07-03");
    expect(parseDob("14 May 2018", today)).toBe("2018-05-14");
    expect(parseDob(new Date(Date.UTC(2019, 0, 9)), today)).toBe("2019-01-09");
    expect(parseDob(43474, today)).toBe("2019-01-09");
    expect(parseDob("01/01/2030", today)).toBeNull();
    expect(parseDob("soon", today)).toBeNull();
  });
});
