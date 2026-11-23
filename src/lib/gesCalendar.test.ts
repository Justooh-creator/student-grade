import { describe, expect, it } from "vitest";
import { gesDateHints } from "./gesCalendar";

describe("gesDateHints", () => {
  it("Term 1 2026/2027 vacates 17 Dec 2026 and Term 2 reopens 5 Jan 2027", () => {
    expect(gesDateHints("2026/2027", "Term 1")).toEqual({ vacate: "17th December 2026", reopen: "5th January 2027" });
  });
  it("Term 2 2026/2027 vacates 25 Mar 2027 and Term 3 reopens 20 Apr 2027", () => {
    expect(gesDateHints("2026/2027", "Term 2")).toEqual({ vacate: "25th March 2027", reopen: "20th April 2027" });
  });
  it("Term 3 has no known next reopening date", () => {
    expect(gesDateHints("2026/2027", "Term 3")).toEqual({ vacate: "22nd July 2027" });
  });
  it("offers nothing for years without official dates", () => {
    expect(gesDateHints("2027/2028", "Term 1")).toEqual({});
  });
});
