import { describe, it, expect } from "vitest";
import { qaSubjects, qaBankSubject, GHANAIAN_LANGUAGES, theoryParts } from "./qaSubjects";
import { englishWritten } from "./englishWritten";
describe("Q&A subject selection", () => {
  it("includes KG learning areas and primary subjects", () => {
    expect(qaSubjects("kg1")).toContain("Numeracy");
    expect(qaSubjects("kg2")).toContain("Language and Literacy");
    for (const id of ["b1", "b2", "b3", "b4", "b5", "b6"] as const) {
      expect(qaSubjects(id)).toContain("Ghanaian Language");
      expect(qaSubjects(id)).toContain("English Language");
      expect(qaSubjects(id)).toContain("Science");
    }
  });
  it("offers all eleven language choices and does not substitute Ewe for unfinished languages", () => {
    expect(GHANAIAN_LANGUAGES).toEqual(["Asante Twi", "Akuapem Twi", "Fante", "Eʋegbe", "Ga", "Dangme", "Dagbani", "Dagaare", "Gonja", "Kasem", "Nzema"]);
    expect(qaBankSubject("Ghanaian Language", "Ga")).toBe("Ghanaian Language (Ga)");
    expect(qaBankSubject("Numeracy", "Eʋegbe")).toBe("Mathematics");
  });
  it("retains the introduction and separates vertical lettered parts", () => {
    expect(theoryParts("Read this. (a) First. (b) Second.")).toEqual(["Read this.", "(a) First.", "(b) Second."]);
  });
  it("English has three composition choices, compulsory comprehension and literature", () => {
    expect(englishWritten(10).map((q) => q.topic)).toEqual(["Composition", "Composition", "Composition", "Comprehension", "Literature"]);
    expect(englishWritten(10).map((q) => q.marks)).toEqual([30, 30, 30, 30, 10]);
    expect(englishWritten(10)).toEqual(englishWritten(10));
    expect(englishWritten(11)[3]?.q).not.toBe(englishWritten(10)[3]?.q);
  });
});