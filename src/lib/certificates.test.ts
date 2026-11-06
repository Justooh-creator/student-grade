import { describe, it, expect } from "vitest";
import { DEFAULT_DISPLAY, DISPLAY_LABELS, headerLines, signerTitles, canMakeCertificates, paperSize } from "./certificates";

const school = { name: "Awuyakope D/A Basic", motto: "Knowledge is power", district: "South Tongu", region: "Volta" };

describe("certificate display options", () => {
  it("has exactly 12 toggles, all on by default", () => {
    expect(DISPLAY_LABELS).toHaveLength(12);
    expect(Object.values(DEFAULT_DISPLAY).every(Boolean)).toBe(true);
  });
  it("hidden header lines leave no gap", () => {
    expect(headerLines(school, { ...DEFAULT_DISPLAY, motto: false }).map((l) => l.kind)).toEqual(["name", "location"]);
    expect(headerLines(school, { ...DEFAULT_DISPLAY, schoolName: false, motto: false, location: false })).toEqual([]);
  });
  it("empty motto is skipped even when shown", () => {
    expect(headerLines({ ...school, motto: " " }, DEFAULT_DISPLAY).map((l) => l.kind)).toEqual(["name", "location"]);
  });
});

describe("signature titles", () => {
  it("defaults and presets", () => {
    expect(signerTitles("ct_ht", { left: "", right: "" })).toEqual({ left: "Class Teacher", right: "Headteacher" });
    expect(signerTitles("ht_only", { left: "", right: "" }).left).toBeNull();
    expect(signerTitles("custom", { left: "PTA Chair", right: "Director" })).toEqual({ left: "PTA Chair", right: "Director" });
  });
});

describe("permissions and paper", () => {
  it("only head roles in a school; independent teachers allowed", () => {
    expect(canMakeCertificates(false)).toBe(true);
    expect(canMakeCertificates(true, "teacher")).toBe(false);
    expect(canMakeCertificates(true, "assistant_headteacher")).toBe(true);
  });
  it("A3 portrait is 297×420mm", () => {
    expect(paperSize("A3", "portrait", { w: 0, h: 0, unit: "mm" })).toEqual({ w: 297, h: 420 });
  });
});
