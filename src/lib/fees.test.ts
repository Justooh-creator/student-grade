import { describe, expect, it } from "vitest";
import { computeFees, whatsappPhone, type FeeItem } from "./fees";

const feeding: FeeItem = { id: "f", name: "Feeding", daily_rate: 5, default_on: true };
const bus: FeeItem = { id: "b", name: "Bus", daily_rate: 6, default_on: false };
const day = (date: string, entries: { id: string; present: boolean; unpaid?: boolean }[]) => ({ class_id: "kg1", attendance_date: date, entries: entries.map((e) => ({ ...e, name: e.id })) });

describe("Daily fee register", () => {
  it("expects cash only for present learners enrolled in each fee", () => {
    const r = computeFees([feeding, bus], [day("2026-10-26", [{ id: "a", present: true }, { id: "c", present: false }])], [], { a: { b: true } });
    expect(r.day("2026-10-26").cash).toBe(11);
  });
  it("records Unpaid as owed, not cash", () => {
    const r = computeFees([feeding], [day("2026-10-26", [{ id: "a", present: true, unpaid: true }])], [], {});
    expect(r.day("2026-10-26")).toMatchObject({ cash: 0, owed: 5 });
    expect(r.balances[0]?.debt).toBe(5);
  });
  it("uses advance payment before expecting cash", () => {
    const r = computeFees([feeding], [day("2026-10-26", [{ id: "a", present: true }]), day("2026-10-27", [{ id: "a", present: true }])], [{ learner_id: "a", fee_id: "f", amount: 5, kind: "advance", paid_on: "2026-10-25" }], {});
    expect(r.day("2026-10-26")).toMatchObject({ cash: 0, prepaid: 5 });
    expect(r.day("2026-10-27").cash).toBe(5);
  });
  it("clears arrears when the parent pays later", () => {
    const r = computeFees([feeding], [day("2026-10-26", [{ id: "a", present: true, unpaid: true }])], [{ learner_id: "a", fee_id: "f", amount: 5, kind: "arrears", paid_on: "2026-10-27" }], {});
    expect(r.balances[0]?.debt).toBe(0);
    expect(r.day("2026-10-27").arrearsRecovered).toBe(5);
  });
  it("formats Ghana numbers for WhatsApp", () => { expect(whatsappPhone("0244 123 456")).toBe("233244123456"); });
  it("inherits general Feeding 5 and Bus 6 when unchanged", () => {
    const r = computeFees([feeding, bus], [day("2026-10-27", [{ id: "a", present: true }])], [], { a: { b: true } }, { a: {} });
    expect(r.day("2026-10-27").cash).toBe(11);
  });
  it("uses each child's changed Feeding and Bus amounts", () => {
    const r = computeFees([feeding, bus], [day("2026-10-27", [{ id: "a", present: true }, { id: "c", present: true }])], [], { a: { b: true }, c: { b: true } }, { a: { f: 4, b: 8 } });
    expect(r.day("2026-10-27").cash).toBe(23);
  });
  it("keeps an explicit zero custom rate instead of the general price", () => {
    const r = computeFees([feeding], [day("2026-10-27", [{ id: "a", present: true }])], [], {}, { a: { f: 0 } });
    expect(r.day("2026-10-27").cash).toBe(0);
  });
  it("uses custom rates for itemized arrears and advance coverage", () => {
    const r = computeFees([feeding, bus], [day("2026-10-27", [{ id: "a", present: true, unpaid: true }])], [{ learner_id: "a", fee_id: "f", amount: 4, kind: "advance", paid_on: "2026-10-26" }], { a: { b: true } }, { a: { f: 4, b: 8 } });
    expect(r.day("2026-10-27")).toMatchObject({ prepaid: 4, owed: 8, cash: 0 });
    expect(r.balances.find((b) => b.feeId === "b")?.debt).toBe(8);
  });
  it("returns to the current general rate when a custom rate is removed", () => {
    const r = computeFees([{ ...feeding, daily_rate: 7 }], [day("2026-10-27", [{ id: "a", present: true }])], [], {}, { a: {} });
    expect(r.day("2026-10-27").cash).toBe(7);
  });
});
