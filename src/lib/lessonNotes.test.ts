import { describe, expect, it } from "vitest";
import { blankLesson, lessonMinutes, lessonStorageKey, parseLessonNotes, saveLessonNote, scannedComputingExample } from "./lessonNotes";

describe("offline lesson notes", () => {
  it("keeps drafts separate for each teacher", () => {
    expect(lessonStorageKey("teacher-a")).not.toBe(lessonStorageKey("teacher-b"));
  });
  it("restores editable drafts without altering their contents", () => {
    const note = { ...blankLesson("Test School"), title: "Counting", main: "Count 5 counters", indicator: "Teacher-entered indicator" };
    const saved = saveLessonNote([], note, "one");
    expect(parseLessonNotes(JSON.stringify(saved))).toEqual(saved);
    expect(saveLessonNote(saved, { ...note, main: "Count 10 counters" }, "one")).toHaveLength(1);
    expect(saved[0]?.main).toBe("Count 5 counters");
  });
  it("preserves the uploaded sample's 50-minute timing", () => {
    expect(lessonMinutes(scannedComputingExample("School"))).toBe(50);
    expect(scannedComputingExample("School").classId).toBe("b9");
  });
  it("safely ignores corrupt local drafts", () => {
    expect(parseLessonNotes("{bad")).toEqual([]);
    expect(parseLessonNotes('[{"id":42},null]')).toEqual([]);
  });
});