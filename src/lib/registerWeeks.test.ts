import { describe, it, expect } from "vitest";
import { schoolDays, weekGroups, dailySexTotals, weeklyTotals, sexOf } from "./register";
describe("register weekly totals", () => {
  it("groups Sept 2026 into Mon–Fri weeks", () => {
    const w = weekGroups(schoolDays(2026, 8));
    expect(w[0]!.length).toBe(4); // Tue 1 – Fri 4
    expect(w[1]!.length).toBe(5);
  });
  it("sums boys and girls, skipping closed days", () => {
    const days = ["2026-09-07", "2026-09-08"];
    const rows = [{ marks: ["P", "P"] as const }, { marks: ["P", "A"] as const }].map((r) => ({ marks: [...r.marks] }));
    const daily = dailySexTotals(rows, [sexOf("Male"), sexOf("Female")], days, { "2026-09-08": "Holiday" });
    expect(daily).toEqual([{ boys: 1, girls: 1 }, { boys: 0, girls: 0 }]);
    const wk = weeklyTotals([[0, 1]], days, daily, new Set(days), { "2026-09-08": "Holiday" });
    expect(wk[0]).toEqual({ open: 1, cumulative: 1, boys: 1, girls: 1, total: 2 });
  });
});
