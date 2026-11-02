import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { signOutWithFingerprint } from "./biometric";

describe("fingerprint sign-out confirmation", () => {
  const values = new Map<string, string>();
  const verify = vi.fn();
  const endSession = vi.fn(async () => {});
  beforeEach(() => {
    values.clear();
    vi.clearAllMocks();
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => values.get(key) ?? null,
      removeItem: (key: string) => values.delete(key),
    });
    vi.stubGlobal("window", { location: { hostname: "edureportghana.com" } });
    vi.stubGlobal("navigator", { credentials: { get: verify } });
  });
  afterEach(() => vi.unstubAllGlobals());

  it("requires device verification before enabled users sign out", async () => {
    values.set("edureport:fingerprint:teacher", btoa("credential"));
    values.set("edureport:fp-active:teacher", "123");
    verify.mockImplementation(async () => {
      expect(endSession).not.toHaveBeenCalled();
      return { id: "credential" };
    });
    expect(await signOutWithFingerprint("teacher", endSession)).toBe(true);
    expect(verify).toHaveBeenCalledWith(expect.objectContaining({
      publicKey: expect.objectContaining({ userVerification: "required", rpId: "edureportghana.com" }),
    }));
    expect(endSession).toHaveBeenCalledTimes(1);
    expect(values.has("edureport:fp-active:teacher")).toBe(false);
  });

  it("keeps the session when the fingerprint prompt is cancelled", async () => {
    values.set("edureport:fingerprint:teacher", btoa("credential"));
    verify.mockRejectedValue(new DOMException("Cancelled", "NotAllowedError"));
    await expect(signOutWithFingerprint("teacher", endSession)).rejects.toThrow("Cancelled");
    expect(endSession).not.toHaveBeenCalled();
  });

  it("keeps the session when verification returns no credential", async () => {
    values.set("edureport:fingerprint:teacher", btoa("credential"));
    verify.mockResolvedValue(null);
    expect(await signOutWithFingerprint("teacher", endSession)).toBe(false);
    expect(endSession).not.toHaveBeenCalled();
  });

  it("does not prompt users who have not enabled fingerprint unlock", async () => {
    expect(await signOutWithFingerprint("teacher", endSession)).toBe(true);
    expect(verify).not.toHaveBeenCalled();
    expect(endSession).toHaveBeenCalledTimes(1);
  });

  it("retains the unlock marker when ending the session fails", async () => {
    values.set("edureport:fp-active:teacher", "123");
    await expect(signOutWithFingerprint("teacher", async () => { throw new Error("Offline"); })).rejects.toThrow("Offline");
    expect(values.get("edureport:fp-active:teacher")).toBe("123");
  });
});