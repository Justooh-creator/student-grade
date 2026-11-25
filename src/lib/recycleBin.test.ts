import { describe, expect, it } from "vitest";
import { daysUntilPurge, headCanRestore, headDaysLeft } from "./recycleBin";

const DAY = 86400000;
const now = Date.parse("2026-11-22T12:00:00Z");
const ago = (d: number) => new Date(now - d * DAY).toISOString();

describe("recycle bin windows", () => {
  it("school countdown starts at 15 and decreases independently of the developer's 30 days", () => {
    expect(headDaysLeft(ago(0), now)).toBe(15);
    expect(headDaysLeft(ago(1), now)).toBe(14);
    expect(headDaysLeft(ago(15), now)).toBe(0);
    expect(daysUntilPurge(ago(1), now)).toBe(29);
  });
  it("headteacher can restore up to 14 days", () => {
    expect(headCanRestore(ago(2), now)).toBe(true);
    expect(headCanRestore(ago(14), now)).toBe(true);
  });
  it("after 14 days the headteacher must contact the developer", () => {
    expect(headCanRestore(ago(15), now)).toBe(false);
  });
  it("counts down to permanent deletion at 30 days", () => {
    expect(daysUntilPurge(ago(2), now)).toBe(28);
    expect(daysUntilPurge(ago(31), now)).toBe(0);
  });
});
