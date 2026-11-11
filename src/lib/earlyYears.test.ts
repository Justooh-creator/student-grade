import { describe, it, expect } from "vitest";
import { generateJhsPack, hasDynamicPack } from "./dynamicJhs";
import { qaSubjects, qaBankSubject } from "./qaSubjects";

describe("KG 1–Basic 3 Q&A packs", () => {
  for (const id of ["kg1", "kg2", "b1", "b2", "b3"] as const) {
    it(`${id}: every non-maths subject gives 45 fresh objectives`, () => {
      for (const s of qaSubjects(id).filter((x) => x !== "Mathematics" && x !== "Numeracy")) {
        const name = qaBankSubject(s, "Eʋegbe");
        expect(hasDynamicPack(id, name), name).toBe(true);
        const pack = generateJhsPack(id, name, 42);
        expect(pack.objectives).toHaveLength(45);
        expect(pack.theory.length).toBeGreaterThanOrEqual(5);
      }
    });
  }
});
