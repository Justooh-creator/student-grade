import { describe, expect, it } from "vitest";
import { computeStudentResult } from "./results";
import type { Student } from "./store";

const base = (classId: Student["classId"], scores: Student["scores"]): Student => ({
  id: "x", name: "T", admissionNo: "", classId, attendance: "", scores, conduct: "", interest: "", remark: "",
});

describe("assessment by class level", () => {
  it("KG1 ignores SBA/Exam marks and does not apply 30/70", () => {
    const r = computeStudentResult(base("kg1", { Numeracy: { sba: 30, exam: 70 } }));
    const row = r.subjects.find((s) => s.subject === "Numeracy")!;
    expect(row.total).toBeNull();
    expect(row.level).toBeUndefined();
    expect(r.totalMarks).toBe(0);
    expect(r.aggregate).toBe(0);
  });

  it("KG2 uses the teacher-selected level with no grade", () => {
    const r = computeStudentResult(base("kg2", { Numeracy: { sba: null, exam: null, level: "Silver" } }));
    const row = r.subjects.find((s) => s.subject === "Numeracy")!;
    expect(row.level).toBe("Silver");
    expect(row.grade).toBeNull();
    expect(r.gradedCount).toBe(1);
  });

  it("Basic 4 keeps SBA 50 + Exam 50 with grade 1–9", () => {
    const r = computeStudentResult(base("b4", { "English Language": { sba: 42.5, exam: 44 } }));
    const row = r.subjects.find((s) => s.subject === "English Language")!;
    expect(row.total).toBe(86.5);
    expect(row.grade).toBe(1);
    expect(r.bestSix).toBeNull();
  });

  it("Basic 9 keeps grades and Best Six", () => {
    const s = { sba: 40, exam: 40 };
    const r = computeStudentResult(base("b9", {
      "English Language": s, Mathematics: s, "Integrated Science": s, "Social Studies": { sba: 20, exam: 20 },
      Computing: s, French: s, "Career Technology": s,
    }));
    expect(r.bestSix?.subjects.length).toBe(6);
    expect(r.bestSix?.aggregate).toBe(6);
  });
});
