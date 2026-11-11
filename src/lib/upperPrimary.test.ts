import { describe, it, expect } from "vitest";
import { generateJhsPack, hasDynamicPack } from "./dynamicJhs";
import { qaSubjects, qaBankSubject } from "./qaSubjects";

describe("Basic 4–6 Q&A packs", () => {
  for (const id of ["b4", "b5", "b6"] as const) {
    it(`${id}: every non-maths subject has 45 objectives`, () => {
      for (const s of qaSubjects(id).filter((x) => x !== "Mathematics")) {
        const name = qaBankSubject(s, "Eʋegbe");
        expect(hasDynamicPack(id, name)).toBe(true);
        const pack = generateJhsPack(id, name, 42);
        expect(pack.objectives).toHaveLength(45);
        expect(pack.theory.length).toBeGreaterThanOrEqual(5);
      }
    });
  }
  it("Ghanaian Language uses the English-style written paper (3 compositions, comprehension, literature)", () => {
    for (const id of ["b5", "b8"] as const) {
      expect(generateJhsPack(id, "Ghanaian Language (Eʋegbe)", 7).theory.map((t) => t.marks)).toEqual([30, 30, 30, 30, 10]);
    }
  });
});
