import { describe, expect, it } from "vitest";
import { generateMathPack, MATH_CLASSES, MATH_TOPICS } from "./dynamicMath";
import { scoreQuiz } from "./questionBank";

describe("offline dynamic Mathematics", () => {
  it.each(MATH_CLASSES)("provides 20 objectives and 4 subjective questions for %s", (classId) => {
    const pack = generateMathPack(classId, 42);
    expect(pack.objectives).toHaveLength(20);
    expect(pack.theory).toHaveLength(4);
    expect(new Set(pack.objectives.map((q) => q.q)).size).toBe(20);
    expect(new Set(pack.objectives.map((q) => q.topic))).toEqual(new Set(MATH_TOPICS));
  });

  it.each(MATH_TOPICS)("keeps fresh questions under the same topic: %s", (topic) => {
    const first = generateMathPack("b9", 42, topic);
    const next = generateMathPack("b9", 43, topic, first);
    const old = new Set(first.objectives.map((q) => q.q));
    expect(next.objectives.every((q) => q.topic === topic)).toBe(true);
    expect(next.objectives.some((q) => old.has(q.q))).toBe(false);
    expect(next.objectives.map((q) => q.options[q.answer])).not.toEqual(first.objectives.map((q) => q.options[q.answer]));
    expect(next.theory.every((q) => q.topic === topic)).toBe(true);
  });

  it("preserves answer keys when options are shuffled", () => {
    for (let seed = 0; seed < 40; seed++) {
      for (const classId of MATH_CLASSES) {
        const pack = generateMathPack(classId, seed);
        const answers = Object.fromEntries(pack.objectives.map((q) => [q.id, q.answer]));
        expect(scoreQuiz(pack.objectives, answers)).toEqual({ correct: 20, total: 20, percent: 100 });
        for (const q of pack.objectives) {
          expect(new Set(q.options).size).toBe(4);
          const correct = q.options[q.answer];
          expect(correct).toBeDefined();
          expect(correct).not.toMatch(/NaN|undefined|Infinity/);
          const numbers = q.q.match(/-?\d+(?:\.\d+)?/g)?.map(Number) ?? [];
          const [a = 0, b = 0, c = 0, d = 0] = numbers;
          let expected: number;
          if (q.q.startsWith("Calculate")) expected = a + b * c;
          else if (q.q.startsWith("Evaluate")) expected = a ** (b + d);
          else if (q.q.includes("%")) expected = a * b / 100;
          else if (q.q.startsWith("Find") && q.q.includes("/")) expected = a * c / b;
          else if (q.q.startsWith("Solve")) expected = numbers.length === 4 ? (d - b) / (a - c) : (c - b) / a;
          else if (q.q.startsWith("If y")) expected = a * c + b;
          else if (q.q.includes("rectangle") && q.q.includes("area")) expected = a * b;
          else if (q.q.includes("perimeter")) expected = 2 * (a + b);
          else if (q.q.includes("triangle")) expected = 180 - a - b;
          else if (q.q.includes("circle")) expected = 22 / 7 * a * a;
          else if (q.q.includes("bag")) expected = Number((a / (a + b)).toFixed(2));
          else expected = numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
          const actual = Number(correct?.match(/-?\d+(?:\.\d+)?/)?.[0]);
          expect(actual, q.q).toBeCloseTo(expected, 2);
        }
      }
    }
  });

  it("uses the same numbers and explanations for a reproducible quiz and exam", () => {
    expect(generateMathPack("b8", 123)).toEqual(generateMathPack("b8", 123));
    expect(generateMathPack("b8", 124)).not.toEqual(generateMathPack("b8", 123));
  });
});