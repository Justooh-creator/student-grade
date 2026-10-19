import { describe, it, expect } from "vitest";
import { BANKS, scoreQuiz } from "./questionBank";

describe("question bank", () => {
  it("pilot covers Basic 9 core subjects", () => {
    expect(BANKS.filter((b) => b.classId === "b9").map((b) => b.subject)).toEqual(["Mathematics", "Integrated Science", "English Language"]);
  });
  it("scores correct answers", () => {
    const items = BANKS[0].objectives.slice(0, 4);
    const answers = { [items[0].id]: items[0].answer, [items[1].id]: items[1].answer, [items[2].id]: (items[2].answer + 1) % 4 };
    expect(scoreQuiz(items, answers)).toEqual({ correct: 2, total: 4, percent: 50 });
  });
});
