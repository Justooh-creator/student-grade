import { describe, expect, it } from "vitest";
import { buildBroadsheet } from "./broadsheet";
import type { Student } from "./store";
const base = (id: string, classId: Student["classId"], scores: Student["scores"]): Student => ({ id, classId, name: id, admissionNo: "", scores, attendance: "", conduct: "", interest: "", remark: "" });
describe("class broadsheets", () => {
  it("retains raw marks and 50/50 scaled totals and grades", () => {
    const [r] = buildBroadsheet([base("a", "b4", { Mathematics: { sbaRaw: 80, sba: 40, examRaw: 90, exam: 45 } })], "b4");
    expect(r?.result.subjects.find((s) => s.subject === "Mathematics")).toMatchObject({ sbaRaw: 80, sba: 40, examRaw: 90, exam: 45, total: 85, grade: 1 });
  });
  it("ranks only within the selected stream with tied positions", () => {
    const rows = buildBroadsheet([base("a", "b4a", { Mathematics: { sba: 40, exam: 40 } }), base("b", "b4a", { Mathematics: { sba: 40, exam: 40 } }), base("other", "b4b", { Mathematics: { sba: 50, exam: 50 } })], "b4a");
    expect(rows.map((r) => [r.student.id, r.position])).toEqual([["a", 1], ["b", 1]]);
  });
  it("KG displays performance levels without numeric grade or position", () => {
    const [r] = buildBroadsheet([base("a", "kg1", { Numeracy: { sba: 20, exam: 70, level: "Gold" } })], "kg1");
    expect(r?.position).toBeNull();
    expect(r?.result.subjects.find((s) => s.subject === "Numeracy")).toMatchObject({ level: "Gold", total: null, grade: null });
  });
});