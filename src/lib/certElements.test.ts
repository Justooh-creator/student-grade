import { describe, it, expect } from "vitest";
import { CERT_ELEMENTS, placeElement, updateElement, moveLayer, duplicateElement } from "./certElements";
const el = CERT_ELEMENTS.find((e) => e.category === "crowns")!;
describe("certificate elements", () => {
  it("ships the starter library", () => { expect(CERT_ELEMENTS.length).toBe(50); });
  it("locked elements cannot move", () => {
    const p = updateElement(placeElement(el), { locked: true });
    expect(updateElement(p, { x: 10 }).x).toBe(50);
    expect(updateElement(p, { locked: false }).locked).toBe(false);
  });
  it("clamps opacity and wraps rotation", () => {
    const p = updateElement(placeElement(el), { opacity: 2, rotation: -90 });
    expect(p.opacity).toBe(1); expect(p.rotation).toBe(270);
  });
  it("reorders and duplicates layers", () => {
    const a = placeElement(el), b = placeElement(el);
    expect(moveLayer([a, b], a.key, 1).map((p) => p.key)).toEqual([b.key, a.key]);
    const d = duplicateElement({ ...a, locked: true });
    expect(d.key).not.toBe(a.key); expect(d.locked).toBe(false);
  });
});
