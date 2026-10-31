import { describe, it, expect } from "vitest";
import { generateJhsPack, JHS_SUBJECTS } from "./dynamicJhs";
import { generateMathPack } from "./dynamicMath";
import { quizPageRange, validTheorySelection } from "./qaRules";

describe("JHS packs", () => {
  for (const cls of ["b7", "b8", "b9"] as const) for (const s of JHS_SUBJECTS.filter((x) => x !== "Mathematics")) {
    it(`${cls} ${s} has 45 objectives and 5 theory`, () => {
      const p = generateJhsPack(cls, s, 123);
      expect(p.objectives).toHaveLength(45);
      expect(p.theory).toHaveLength(5);
      expect(new Set(p.objectives.map((q) => q.q)).size).toBe(45);
    });
  }
  it("maths JHS has 45 objectives and 5 theory", () => {
    const p = generateMathPack("b8", 5);
    expect(p.objectives).toHaveLength(45);
    expect(p.theory).toHaveLength(5);
  });
  it("new seed gives different set", () => {
    const a = generateJhsPack("b8", "Integrated Science", 1), b = generateJhsPack("b8", "Integrated Science", 2, a);
    expect(a.objectives.map((q) => q.q)).not.toEqual(b.objectives.map((q) => q.q));
  });
  it("five per page, 9 pages", () => {
    expect(quizPageRange(45, 8)).toEqual({ start: 40, end: 45, pages: 9, current: 8 });
  });
  it("Q1 compulsory plus any 3", () => {
    expect(validTheorySelection([0, 2, 3, 4])).toBe(true);
    expect(validTheorySelection([1, 2, 3, 4])).toBe(false);
  });
});
