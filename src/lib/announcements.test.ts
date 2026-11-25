import { expect, it } from "vitest";
import { announcementError, whatsappPhone } from "./announcements";

it("accepts a Ghanaian WhatsApp phone in local or international format", () => {
  expect(whatsappPhone("0530887628")).toBe("233530887628");
  expect(whatsappPhone("+233 53 088 7628")).toBe("233530887628");
});
it("allows announcements without a WhatsApp action", () => { expect(announcementError("Term update", "Welcome back", "")).toBeNull(); });
it("rejects invalid WhatsApp destinations", () => { expect(announcementError("Term update", "Welcome back", "123")).not.toBeNull(); });