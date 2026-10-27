import { describe, expect, it } from "vitest";
import { accountHome, canOpenApp, signupNextStep } from "./accountAccess";

describe("sign-up-first access", () => {
  it("opens School Details first after sign-in", () => {
    expect(accountHome).toBe("/setup");
  });
  it("blocks visitors without an account session", () => {
    expect(canOpenApp(null, null)).toBe(false);
  });
  it("opens the app for a verified account without any license requirement", () => {
    expect(canOpenApp({ id: "teacher-without-license" }, null)).toBe(true);
  });
  it("rejects failed account verification", () => {
    expect(canOpenApp({ id: "teacher" }, new Error("Invalid session"))).toBe(false);
  });
  it("waits for email confirmation when signup returns no session", () => {
    expect(signupNextStep(null)).toBe("confirm-email");
  });
  it("opens the app when signup returns an authenticated session", () => {
    expect(signupNextStep({ user: { id: "teacher" } })).toBe("open-app");
  });
});