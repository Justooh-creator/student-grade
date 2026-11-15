import { describe, expect, it } from "vitest";
import { filledFeeLines, reportSpacing } from "./reportLayout";

describe("dynamic A4 report spacing", () => {
  it("uses compact rows when fees are on the report card", () => {
    expect(reportSpacing(true).compact).toBe(true);
    expect(reportSpacing(true).rowPad).toBe("py-[2px]");
  });
  it("spreads rows out to fill the page when there are no fees", () => {
    expect(reportSpacing(false).compact).toBe(false);
    expect(reportSpacing(false).rowPad).toBe("py-[5px]");
  });
  it("only counts filled fee fields", () => {
    expect(filledFeeLines(undefined)).toEqual([]);
    expect(filledFeeLines({ arrears: "", levies: " ", items: [{ label: "Bus", amount: "" }] })).toEqual([]);
    expect(filledFeeLines({ arrears: "120", items: [{ label: "PTA", amount: "GH₵ 20" }] }).map((l) => l.n)).toEqual([120, 20]);
  });
});
