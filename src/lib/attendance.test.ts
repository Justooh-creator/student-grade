import { describe, expect, it } from "vitest";
import { attendanceClasses, attendanceClassName, attendanceSummary, attendanceTrialAllowed } from "./attendance";

describe("Daily attendance rules", () => {
  it("covers Crèche, Nursery 1–2, KG 1–2 and Basic 1–9 without altering report classes", () => {
    expect(attendanceClasses()).toEqual(["creche", "nursery1", "nursery2", "kg1", "kg2", "b1", "b2", "b3", "b4", "b5", "b6", "b7", "b8", "b9"]);
    expect(attendanceClassName("nursery2b")).toBe("Nursery 2B");
    expect(attendanceClasses(2)).toContain("crechea");
  });
  it("counts deselected learners as absent", () => {
    expect(attendanceSummary([{ id: "1", name: "A", admissionNo: "", present: true }, { id: "2", name: "B", admissionNo: "", present: false }])).toEqual({ present: 1, absent: 1, total: 2 });
  });
  it("does not start the trial before first saved attendance", () => {
    expect(attendanceTrialAllowed(null, false, Date.parse("2026-10-25T00:00:00Z"))).toBe(true);
  });
  it("ends the trial exactly 14 days after first use, not after repeated attendance", () => {
    const start = "2026-10-25T04:00:00Z";
    expect(attendanceTrialAllowed(start, false, Date.parse("2026-11-08T03:59:59Z"))).toBe(true);
    expect(attendanceTrialAllowed(start, false, Date.parse("2026-11-08T04:00:00Z"))).toBe(false);
  });
  it("allows licensed schools after trial expiry", () => {
    expect(attendanceTrialAllowed("2026-10-25T04:00:00Z", true, Date.parse("2026-12-01T00:00:00Z"))).toBe(true);
  });
});