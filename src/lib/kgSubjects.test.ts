import { describe, it, expect } from "vitest";
import { getClassLevel } from "./ges";
import { computeStudentResult } from "./results";

describe("KG NaCCA learning areas", () => {
  it.each(["kg1", "kg2"])("%s has exactly the four official learning areas", (id) => {
    expect(getClassLevel(id as never).subjects).toEqual(["Language and Literacy", "Numeracy", "Creative Arts", "Our World Our People"]);
  });
  const base = (scores: Record<string, unknown>) => ({ id: "a", classId: "kg1", name: "A", scores } as never);
  it("maps old Music and Movement rating into Creative Arts", () => {
    const r = computeStudentResult(base({ "Music and Movement": { sba: null, exam: null, level: "Gold" } }));
    expect(r.subjects.find((s) => s.subject === "Creative Arts")?.level).toBe("Gold");
  });
  it("keeps Physical Development as a separate observation, not a subject", () => {
    const r = computeStudentResult(base({ "Physical Development": { sba: null, exam: null, level: "Silver" } }));
    expect(r.physical?.level).toBe("Silver");
    expect(r.gradedCount).toBe(0);
  });
  it("does not auto-assign ratings", () => {
    expect(computeStudentResult(base({})).subjects.every((s) => !s.level)).toBe(true);
  });
});
