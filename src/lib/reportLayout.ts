/** Report-card spacing adapts to optional sections so every card fills one A4 page without overflow. */
export interface ReportSpacing { rowPad: string; gap: string; remarkGap: string; compact: boolean }

export function reportSpacing(hasFees: boolean): ReportSpacing {
  return hasFees
    ? { rowPad: "py-[2px]", gap: "mt-2", remarkGap: "space-y-1", compact: true }
    : { rowPad: "py-[5px]", gap: "mt-4", remarkGap: "space-y-2", compact: false };
}

export interface FeeLine { label: string; value: string; n: number | null }

/** Only filled fee items print; empty fields never appear on the report card. */
export function filledFeeLines(f?: { arrears?: string; levies?: string; nextTerm?: string; items?: { label: string; amount: string }[] }): FeeLine[] {
  if (!f) return [];
  const num = (v?: string) => {
    const n = parseFloat((v ?? "").replace(/[^\d.]/g, ""));
    return Number.isFinite(n) ? n : null;
  };
  const out: FeeLine[] = [];
  if (f.arrears?.trim()) out.push({ label: "Fees owed", value: f.arrears, n: num(f.arrears) });
  if (f.levies?.trim()) out.push({ label: "Levies", value: f.levies, n: num(f.levies) });
  if (f.nextTerm?.trim()) out.push({ label: "Next-term fees", value: f.nextTerm, n: num(f.nextTerm) });
  for (const it of f.items ?? []) {
    if (it.label?.trim() && it.amount?.trim()) out.push({ label: it.label.trim(), value: it.amount, n: num(it.amount) });
  }
  return out;
}
