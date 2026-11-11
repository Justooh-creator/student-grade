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
      expect(generateJhsPack(id, "Ghanaian Language (Eʋegbe)", 7).theory.map((t) => t.marks)).toEqual([30, 30, 30, 20, 10, 10]);
    }
  });
  it("Ewe paper has an English → Eʋegbe translation part", () => {
    const pack = generateJhsPack("b8", "Ghanaian Language (Eʋegbe)", 7);
    expect(pack.theory[4]?.topic).toContain("Translation");
    expect(pack.theory[4]?.q).toContain("Translate the following sentences into Eʋegbe");
  });
  it("New Questions gives a different Ewe and English Section B", () => {
    for (const s of ["Ghanaian Language (Eʋegbe)", "English Language"]) {
      const a = generateJhsPack("b8", s, 7);
      const b = generateJhsPack("b8", s, 8, a);
      expect(b.theory[3]?.q).not.toEqual(a.theory[3]?.q);
      expect(b.theory.slice(0, 3).filter((t) => a.theory.some((x) => x.q === t.q)).length).toBeLessThanOrEqual(1);
    }
  });
});
