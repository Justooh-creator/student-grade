import { describe, expect, it } from "vitest";
import { canEditTimetable, defaultTimetable, retimeTimetable } from "./timetable";

const close = (id: Parameters<typeof defaultTimetable>[0]) => defaultTimetable(id).periods.at(-1)!.end;

describe("level closing times", () => {
  it("KG closes at 1:00 PM", () => { expect(close("kg1")).toBe("13:00"); });
  it("Primary closes at 1:30 PM", () => { expect(close("b4")).toBe("13:30"); });
  it("JHS closes at 3:00 PM", () => { expect(close("b8")).toBe("15:00"); });
});

describe("retimeTimetable", () => {
  it("moves the day to new opening and closing times and keeps break lengths", () => {
    const tt = retimeTimetable(defaultTimetable("b4"), "07:30", "14:00")!;
    expect(tt.periods[0]!.start).toBe("07:30");
    expect(tt.periods.at(-1)!.end).toBe("14:00");
    const snack = tt.periods.find((p) => p.label === "Snack Break")!;
    const mins = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3));
    expect(mins(snack.end) - mins(snack.start)).toBe(30);
  });
  it("rejects a closing time before the opening time", () => {
    expect(retimeTimetable(defaultTimetable("b4"), "13:00", "08:00")).toBeNull();
  });
});

describe("canEditTimetable", () => {
  const base = { inSchool: true, classId: "b4", assignments: { b4: ["t1"] } };
  it("headteacher edits any class", () => { expect(canEditTimetable({ ...base, role: "headteacher", userId: "h" })).toBe(true); });
  it("assigned class teacher edits own class", () => { expect(canEditTimetable({ ...base, role: "teacher", userId: "t1" })).toBe(true); });
  it("other teachers cannot edit", () => { expect(canEditTimetable({ ...base, role: "teacher", userId: "t2" })).toBe(false); });
  it("offline users can edit", () => { expect(canEditTimetable({ inSchool: false, classId: "b4" })).toBe(true); });
});
