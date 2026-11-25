import { expect, it } from "vitest";
import { inkOpacity } from "./signatureInk";

it("keeps blue pen ink opaque", () => { expect(inkOpacity(30, 70, 190, 250)).toBe(255); });
it("keeps purple stamp ink opaque", () => { expect(inkOpacity(150, 50, 175, 250)).toBe(255); });
it("keeps red and green stamp ink", () => {
  expect(inkOpacity(210, 60, 60, 250)).toBe(255);
  expect(inkOpacity(40, 170, 70, 250)).toBe(255);
});
it("removes white paper and neutral light shadows", () => {
  expect(inkOpacity(255, 255, 255, 250)).toBe(0);
  expect(inkOpacity(220, 220, 220, 250)).toBe(0);
});