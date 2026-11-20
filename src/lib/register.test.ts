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

import { registerDays as rd } from "./register";
import { describe as d2, it as i2, expect as e2 } from "vitest";
d2("registerDays split weeks", () => {
  i2("Monday 30 Nov 2026 joins December", () => {
    e2(rd(2026, 10).at(-1)).toBe("2026-11-27");
    e2(rd(2026, 11)[0]).toBe("2026-11-30");
  });
});

import { registerOrder } from "./register";
d2("GES register order", () => {
  const l = (name: string, gender: string) => ({ name, gender });
  i2("lists boys A–Z, leaves three blank rows, then girls A–Z", () => {
    const out = registerOrder([l("Esi", "Female"), l("Yaw", "Male"), l("Ama", "F"), l("Kofi", "M"), l("Abla", "")]);
    e2(out.map((x) => x?.name ?? null)).toEqual(["Kofi", "Yaw", null, null, null, "Ama", "Esi", "Abla"]);
  });
  i2("adds no gap when the class has only boys or only girls", () => {
    e2(registerOrder([l("Yaw", "Male"), l("Kofi", "Male")]).includes(null)).toBe(false);
    e2(registerOrder([l("Esi", "Female")]).includes(null)).toBe(false);
  });
});
