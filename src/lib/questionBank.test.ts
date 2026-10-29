import { describe, it, expect } from "vitest";
import { BANKS, scoreQuiz } from "./questionBank";

describe("question bank", () => {
  it("pilot covers Basic 9 core subjects", () => {
    expect(BANKS.filter((b) => b.classId === "b9").map((b) => b.subject)).toEqual(["Mathematics", "Integrated Science", "English Language", "Ghanaian Language (Eʋegbe)", "Social Studies", "Religious and Moral Education", "Computing", "Career Technology"]);
  });
  it("Basic 7 and 8 get the JHS subjects including Ewe", () => {
    for (const c of ["b7", "b8"]) expect(BANKS.some((b) => b.classId === c && b.subject.includes("Eʋegbe"))).toBe(true);
  });
  it("scores correct answers", () => {
    const items = BANKS[0]!.objectives.slice(0, 4);
    const [a, b, c] = [items[0]!, items[1]!, items[2]!];
    const answers = { [a.id]: a.answer, [b.id]: b.answer, [c.id]: (c.answer + 1) % 4 };
    expect(scoreQuiz(items, answers)).toEqual({ correct: 2, total: 4, percent: 50 });
  });
});
