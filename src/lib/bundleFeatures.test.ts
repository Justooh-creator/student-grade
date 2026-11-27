import { describe, expect, it } from "vitest";
import { cumulativeWeekTotals, sortLearnersBoysFirst, type Mark } from "./register";
import { buildBroadsheet, subjectMeritList } from "./broadsheet";
import { buildRosterText, DUTY_PRESETS, dutyReminderContext, mondayOf, type DutyRoster } from "./dutyRoster";
import { applyRemote, getData, type Student } from "./store";

const mkStudent = (id: string, name: string, gender: string, mathTotal?: number): Student => ({
  id, name, admissionNo: id, gender, classId: "b4", attendance: "50",
  scores: mathTotal == null ? {} : { Mathematics: { sba: mathTotal / 2, exam: mathTotal / 2 } },
  conduct: "", interest: "", remark: "",
});

describe("Boys-first alphabetical sorting", () => {
  it("sorts boys A-Z first, then girls A-Z, then unspecified A-Z", () => {
    const list = [
      mkStudent("1", "Zainab", "Female"),
      mkStudent("2", "Kwame", "Male"),
      mkStudent("3", "Ama", "Female"),
      mkStudent("4", "Alex", ""),
      mkStudent("5", "Daniel", "Male"),
    ];
    expect(sortLearnersBoysFirst(list).map((s) => s.name)).toEqual(["Daniel", "Kwame", "Ama", "Zainab", "Alex"]);
  });

  it("sorts broadsheet rows Boys A-Z then Girls A-Z and trims leading spaces", () => {
    const list = [
      mkStudent("1", "Fiadufe Eva", "Female", 70),
      mkStudent("2", " Kwame Mensah", "Male", 80),
      mkStudent("3", "Ama Boateng", "Female", 90),
      mkStudent("4", "Daniel Asare", "Male", 60),
    ];
    expect(buildBroadsheet(list, "b4").map((r) => r.student.name)).toEqual([
      "Daniel Asare",
      " Kwame Mensah",
      "Ama Boateng",
      "Fiadufe Eva",
    ]);
  });
});

describe("Remote student sync normalization", () => {
  it("guarantees scores object exists when remote sync omits scores", () => {
    const partial = { id: "s-new", name: "Kofi", admissionNo: "", gender: "Male", classId: "b4" } as unknown as Student;
    applyRemote((cur) => ({ ...cur, students: [partial] }));
    const saved = getData().students.find((s) => s.id === "s-new");
    expect(saved?.scores).toEqual({});
  });
});

describe("Class Register cumulative weekly attendance", () => {
  it("accumulates week 1 -> week 2 -> week 3 and leaves unmarked future weeks blank", () => {
    const days = [
      "2026-11-02", "2026-11-03", "2026-11-04", "2026-11-05", "2026-11-06",
      "2026-11-09", "2026-11-10", "2026-11-11", "2026-11-12", "2026-11-13",
      "2026-11-16", "2026-11-17", "2026-11-18", "2026-11-19", "2026-11-20",
      "2026-11-23", "2026-11-24", "2026-11-25", "2026-11-26", "2026-11-27",
    ];
    const weeks = [[0, 1, 2, 3, 4], [5, 6, 7, 8, 9], [10, 11, 12, 13, 14], [15, 16, 17, 18, 19]];
    const marks: Mark[] = [
      "P", "P", "P", "A", "A", // Week 1 = 3
      "P", "P", "P", "P", "P", // Week 2 = 5 -> cumulative 8
      "P", "P", "P", "P", "A", // Week 3 = 4 -> cumulative 12
      "", "", "", "", "",       // Week 4 = unmarked -> null
    ];
    const marked = new Set(days.slice(0, 15));
    expect(cumulativeWeekTotals(marks, weeks, days, marked, {})).toEqual([3, 8, 12, null]);
  });
});

describe("Subject Merit List ranking", () => {
  it("ranks learners 1st to last with GES tie-breaking and places ungraded at the end", () => {
    const students = [
      mkStudent("a", "Kofi", "Male", 80),
      mkStudent("b", "Ama", "Female", 92),
      mkStudent("c", "Yaw", "Male", 80),
      mkStudent("d", "Efua", "Female", 70),
      mkStudent("e", "Kojo", "Male"),
    ];
    const merit = subjectMeritList(buildBroadsheet(students, "b4"), "Mathematics");
    expect(merit.map((m) => [m.student.name, m.position])).toEqual([
      ["Ama", 1],
      ["Kofi", 2],
      ["Yaw", 2],
      ["Efua", 4],
      ["Kojo", null],
    ]);
  });
});

describe("Duty Roster clean phrasing and Friday/Sunday reminders", () => {
  it("removes 'whole week' and 'All week' from presets and roster text", () => {
    expect(DUTY_PRESETS.join(" ").toLowerCase()).not.toContain("whole week");
    const text = buildRosterText({
      week_start: "2026-11-30",
      entries: [{ day: "All week", duty: "Teacher on Duty (whole week)", time: "", location: "", teacherId: "u1", teacherName: "Mr. Mensah" }],
      notes: "",
    }, "Awuyakope D/A");
    expect(text.toLowerCase()).not.toContain("all week");
    expect(text.toLowerCase()).not.toContain("whole week");
    expect(text).toContain("Mr. Mensah: Teacher on Duty");
  });

  it("shows Friday advance notice and Sunday tomorrow-is-duty-day alerts", () => {
    const fri = new Date("2026-11-27T10:00:00Z"); // Friday
    const sun = new Date("2026-11-29T10:00:00Z"); // Sunday
    const nextMon = mondayOf(fri, 1);
    const roster: DutyRoster = {
      id: "r1", school_id: "s1", created_by: "h1", week_start: nextMon,
      entries: [{ day: "", duty: "Teacher on Duty", time: "", location: "", teacherId: "t1", teacherName: "Ama" }],
      notes: "", updated_at: "",
    };
    const friCtx = dutyReminderContext([roster], [], "t1", fri);
    expect(friCtx.isFriday).toBe(true);
    expect(friCtx.bannerText).toContain("Friday reminder");
    const sunCtx = dutyReminderContext([roster], [], "t1", sun);
    expect(sunCtx.isSunday).toBe(true);
    expect(sunCtx.bannerText).toContain("Tomorrow is your Duty Day");
  });
});