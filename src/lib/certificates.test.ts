import { describe, it, expect } from "vitest";
import { DEFAULT_DISPLAY, DISPLAY_LABELS, headerLines, signerTitles, canMakeCertificates, paperSize, certificateSession, certificatePresentation } from "./certificates";

const school = { name: "Awuyakope D/A Basic", motto: "Knowledge is power", district: "South Tongu", region: "Volta" };

describe("certificate display options", () => {
  it("retains all preferences and splits session into two toggles", () => {
    expect(DISPLAY_LABELS).toHaveLength(13);
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

describe("independent academic details", () => {
  it("shows academic year without term", () => {
    expect(certificateSession("Term 1", "2026/2027", { ...DEFAULT_DISPLAY, term: false })).toBe("2026/2027 Academic Year");
  });
  it("shows term without academic year", () => {
    expect(certificateSession("Term 1", "2026/2027", { ...DEFAULT_DISPLAY, academicYear: false })).toBe("Term 1");
  });
  it("omits the session when both are hidden", () => {
    expect(certificateSession("Term 1", "2026/2027", { ...DEFAULT_DISPLAY, term: false, academicYear: false })).toBe("");
  });
  it("combines both without stray separators", () => {
    expect(certificateSession("Term 1", "2026/2027", DEFAULT_DISPLAY)).toBe("Term 1 · 2026/2027 Academic Year");
  });
  it("adapts citation presentation for either recipient type", () => {
    expect(certificatePresentation("Citation")).toBe("In honour of");
    expect(certificatePresentation("Citation of Honour")).toBe("In honour of");
    expect(certificatePresentation("Certificate of Award")).toBe("This certificate is proudly presented to");
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
