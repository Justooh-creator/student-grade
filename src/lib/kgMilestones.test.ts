import { describe, expect, it } from "vitest";
import { kgMilestones } from "./kgMilestones";

describe("KG progress checklists", () => {
  it("KG 1 follows its own assessment tool: 14, 16 and 20 items", () => {
    expect(kgMilestones("kg1", "Term 1")).toHaveLength(14);
    expect(kgMilestones("kg1", "Term 2")).toHaveLength(16);
    expect(kgMilestones("kg1", "Term 3")).toHaveLength(20);
    expect(kgMilestones("kg1", "Term 1")[0]?.text).toBe("Provide information about oneself.");
    expect(kgMilestones("kg1", "Term 3")[19]?.text).toBe("Retell a story heard.");
  });
  it("KG 2 keeps its 20, 21 and 20 items, separate from KG 1", () => {
    expect(kgMilestones("kg2", "Term 1")).toHaveLength(20);
    expect(kgMilestones("kg2", "Term 2")).toHaveLength(21);
    expect(kgMilestones("kg2", "Term 3")).toHaveLength(20);
    expect(kgMilestones("kg2", "Term 1")[0]?.text).not.toBe(kgMilestones("kg1", "Term 1")[0]?.text);
  });
});
