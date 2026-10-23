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
