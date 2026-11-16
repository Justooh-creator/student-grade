import { describe, expect, it } from "vitest";
import { CLASS_LEVELS } from "./ges";

describe("KG subject order", () => {
  it.each(["kg1", "kg2"])("%s ends with Physical Development then Our World Our People", (id) => {
    const subjects = CLASS_LEVELS.find((c) => c.id === id)!.subjects;
    expect(subjects.slice(-2)).toEqual(["Physical Development", "Our World Our People"]);
  });
});
