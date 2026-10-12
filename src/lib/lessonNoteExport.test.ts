import { describe, expect, it } from "vitest";
import { LESSON_PAGE } from "./lessonNoteExport";

describe("lesson-note paper size", () => {
  it("uses exactly 210 × 297 mm for PDF", () => {
    expect([LESSON_PAGE.widthMm, LESSON_PAGE.heightMm]).toEqual([210, 297]);
  });
  it("uses A4 dimensions for editable Word documents", () => {
    expect([LESSON_PAGE.widthDxa, LESSON_PAGE.heightDxa]).toEqual([11906, 16838]);
  });
});