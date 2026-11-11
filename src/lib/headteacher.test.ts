import { describe, expect, it } from "vitest";
import { canCustomHeadRemark } from "./headteacher";

describe("canCustomHeadRemark", () => {
  it("allows the named headteacher", () => {
    expect(canCustomHeadRemark("Ama Serwaa", "Ama Serwaa")).toBe(true);
  });
  it("ignores letter case and extra spaces", () => {
    expect(canCustomHeadRemark("  ama   serwaa ", "Ama Serwaa")).toBe(true);
  });
  it("blocks other teachers", () => {
    expect(canCustomHeadRemark("Kofi Mensah", "Ama Serwaa")).toBe(false);
  });
  it("blocks everyone when no headteacher name is saved", () => {
    expect(canCustomHeadRemark("Ama Serwaa", "")).toBe(false);
    expect(canCustomHeadRemark("Ama Serwaa", "   ")).toBe(false);
  });
  it("blocks an empty profile name", () => {
    expect(canCustomHeadRemark("", "Ama Serwaa")).toBe(false);
  });
});

import { test as t2, expect as e2 } from "vitest";
t2("school admin role can always type custom remark", () => {
  e2(canCustomHeadRemark("Anyone", "", "headteacher")).toBe(true);
  e2(canCustomHeadRemark("Anyone", "Mr Mensah", "teacher")).toBe(false);
});
