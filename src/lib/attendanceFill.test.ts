import { describe, it, expect } from "vitest";
import { countPresentDays, parseTermDate } from "./attendanceFill";
describe("attendance auto-fill", () => {
  it("parses ordinal term dates", () => { expect(parseTermDate("8th September 2026")).toBe("2026-09-08"); });
  it("counts present days only inside the term", () => {
    const rows = [
      { attendance_date: "2026-09-07", entries: [{ id: "a", present: true }] },
      { attendance_date: "2026-09-08", entries: [{ id: "a", present: true }, { id: "b", present: false }] },
      { attendance_date: "2026-09-09", entries: [{ id: "a", present: true }, { id: "b", present: true }] },
    ];
    expect(countPresentDays(rows, "2026-09-08", "2026-12-17")).toEqual({ a: 2, b: 1 });
  });
});
