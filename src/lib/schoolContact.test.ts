import { describe, expect, it } from "vitest";
import { DEFAULT_SCHOOL, keepLocalSchoolImages, stripSchoolImages } from "./store";

describe("school contact persistence", () => {
  it("retains the entered contact through cloud serialization and read-back", () => {
    const school = { ...DEFAULT_SCHOOL, contactPhone: "+233 24 123 4567", logo: "local-logo" };
    const remote = JSON.parse(JSON.stringify(stripSchoolImages(school)));
    expect(remote.contactPhone).toBe("+233 24 123 4567");
    expect(keepLocalSchoolImages(school, remote).contactPhone).toBe("+233 24 123 4567");
  });

  it("does not invent a contact for existing school records", () => {
    expect(DEFAULT_SCHOOL.contactPhone).toBe("");
    const legacySchool = { ...DEFAULT_SCHOOL };
    delete legacySchool.contactPhone;
    expect(keepLocalSchoolImages(DEFAULT_SCHOOL, legacySchool).contactPhone).toBeUndefined();
  });
});