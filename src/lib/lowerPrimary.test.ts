import { describe, expect, it } from "vitest";
import { generateJhsPack, hasDynamicPack } from "./dynamicJhs";
import { generateMathPack } from "./dynamicMath";
import { LOWER_FACTS } from "./lowerPrimaryContent";
import { qaBankSubject, qaSubjects } from "./qaSubjects";
import { scoreQuiz } from "./questionBank";

describe("Independent Basic 1–3 practice papers", () => {
  for (const classId of ["b1", "b2", "b3"] as const) {
    for (const display of qaSubjects(classId)) {
      const subject = qaBankSubject(display, "Eʋegbe");
      it(`${classId} ${subject}: 45 distinct objectives and five matching written questions`, () => {
        for (const seed of [0, 1, 42, 999, 4294967295]) {
          const pack = subject === "Mathematics" ? generateMathPack(classId, seed) : generateJhsPack(classId, subject, seed);
          expect(pack.objectives).toHaveLength(45);
          expect(new Set(pack.objectives.map((q) => q.q)).size).toBe(45);
          expect(pack.theory).toHaveLength(5);
          expect(scoreQuiz(pack.objectives, Object.fromEntries(pack.objectives.map((q) => [q.id, q.answer])))).toEqual({ correct: 45, total: 45, percent: 100 });
          for (const q of pack.objectives) {
            expect(new Set(q.options).size).toBe(4);
            expect(q.options[q.answer]).toBeTruthy();
            expect(q.explain.length).toBeGreaterThan(0);
          }
          expect(pack.theory.every((q) => q.scheme.length > 0)).toBe(true);
        }
      });
      if (subject === "Mathematics") continue;
      it(`${classId} ${subject}: never copies upper-primary objectives or written questions`, () => {
        const lower = generateJhsPack(classId, subject, 42);
        const upper = generateJhsPack("b4", subject, 42);
        const old = new Set([...upper.objectives.map((q) => q.q), ...upper.theory.map((q) => q.q)]);
        expect([...lower.objectives, ...lower.theory].filter((q) => old.has(q.q))).toHaveLength(0);
        expect(generateJhsPack(classId, subject, 42)).toEqual(lower);
        const fresh = generateJhsPack(classId, subject, 43, lower);
        expect(fresh.objectives.map((q) => q.q)).not.toEqual(lower.objectives.map((q) => q.q));
        expect(fresh.objectives.filter((q) => !lower.objectives.some((o) => o.q === q.q)).length).toBeGreaterThanOrEqual(10);
      });
    }
    it(`${classId}: English and Ewe retain composition choices, comprehension and literature`, () => {
      for (const subject of ["English Language", "Ghanaian Language (Eʋegbe)"]) {
        const pack = generateJhsPack(classId, subject, 42);
        expect(pack.theory.map((q) => q.marks)).toEqual([30, 30, 30, 30, 10]);
        expect(pack.theory[3]?.scheme).toHaveLength(5);
        expect(pack.theory[4]?.scheme).toHaveLength(4);
        const changed = generateJhsPack(classId, subject, 43).theory[3];
        expect(changed?.q).not.toEqual(pack.theory[3]?.q);
        expect(changed?.scheme).not.toEqual(pack.theory[3]?.scheme);
      }
    });
    it(`${classId}: unbuilt languages stay unavailable`, () => {
      expect(hasDynamicPack(classId, "Ghanaian Language (Ga)")).toBe(false);
      expect(() => generateJhsPack(classId, "Ghanaian Language (Ga)", 1)).toThrow();
    });
  }
  it("Basic 1 has only introductory concepts; Basic 2 and 3 include their new ideas", () => {
    for (const [subject, facts] of Object.entries(LOWER_FACTS)) {
      for (const classId of ["b1", "b2", "b3"] as const) {
        const grade = Number(classId.slice(1));
        const pack = generateJhsPack(classId, subject, 42);
        const advanced = facts.filter((f) => (f[3] ?? 1) > grade);
        for (const fact of advanced) expect(pack.objectives.some((q) => q.explain === `${fact[0]}: ${fact[1]}.` || q.explain === `${fact[1]} Answer: ${fact[0]}.`)).toBe(false);
        if (grade > 1) {
          const current = facts.filter((f) => f[3] === grade);
          expect(pack.objectives.filter((q) => current.some((f) => f[2] === q.topic)).length).toBeGreaterThanOrEqual(6);
        }
      }
    }
  });
  it("language writing grows from three to five to seven short sentences", () => {
    for (const [classId, count] of [["b1", 3], ["b2", 5], ["b3", 7]] as const) {
      const q = generateJhsPack(classId, "English Language", 1).theory[0];
      expect(q?.q).toContain(`Write ${count} short sentences`);
      expect(q?.q).not.toContain("250 words");
    }
  });
});