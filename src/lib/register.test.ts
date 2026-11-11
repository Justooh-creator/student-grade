import { describe, it, expect } from "vitest";
import { schoolDays, registerMarks } from "./register";
describe("monthly register", () => {
  it("lists only weekdays (Nov 2026 has 21)", () => {
    const d = schoolDays(2026, 10);
    expect(d.length).toBe(21);
    expect(d[0]).toBe("2026-11-02");
  });
  it("marks P/A on saved days and blank on unmarked days", () => {
    const r = registerMarks(["a"], ["d1", "d2", "d3"], { d1: [{ id: "a", name: "", admissionNo: "", present: true }], d2: [{ id: "a", name: "", admissionNo: "", present: false }] });
    expect(r[0]).toEqual({ id: "a", marks: ["P", "A", ""], present: 1, absent: 1 });
  });
});
