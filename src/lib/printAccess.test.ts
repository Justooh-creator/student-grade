import { describe, it, expect } from "vitest";
import { canPrintReports } from "./printAccess";
describe("report card printing", () => {
  it("blocks class teachers in a school", () => expect(canPrintReports(true, "teacher")).toBe(false));
  it("allows headteacher, assistant headteacher and admin", () => {
    for (const r of ["headteacher", "assistant_headteacher", "admin"]) expect(canPrintReports(true, r)).toBe(true);
  });
  it("allows independent teachers not in a school", () => expect(canPrintReports(false)).toBe(true));
});
