import { describe, expect, it } from "vitest";
import { applyCatalogEntry, catalogFor } from "@/lib/lessonCatalog";
import { blankLesson } from "@/lib/lessonNotes";

describe("lesson catalog", () => {
  it("fills curriculum content but keeps the teacher's class size and name", () => {
    const note = { ...blankLesson("My School"), classId: "b5", classSize: "32", vettedBy: "Head" };
    const entry = catalogFor("b5", "Mathematics", 1)[0]!;
    const filled = applyCatalogEntry(note, entry);
    expect(filled.classSize).toBe("32");
    expect(filled.vettedBy).toBe("Head");
    expect(filled.strand).toBe("Number");
  });
  it("never marks unverified draft entries as official", () => {
    expect(catalogFor("b5", "Mathematics", 1).every((e) => !e.verified)).toBe(true);
  });
});

describe("KG numeracy catalog", () => {
  it("covers KG 1 and KG 2 for all three terms with official codes", () => {
    for (const c of ["kg1", "kg2"]) for (const t of [1, 2, 3]) {
      const e = catalogFor(c, "Numeracy", t);
      expect(e.length).toBeGreaterThan(0);
      expect(e.every((x) => x.verified && /^K[12]\.\d+\.\d+\.\d+\.\d+$/.test(x.fill.indicator ?? ""))).toBe(true);
    }
  });
});
