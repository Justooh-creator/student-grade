export interface FeeItem { id: string; name: string; daily_rate: number; default_on: boolean }
export interface FeeDayEntry { id: string; name: string; present: boolean; unpaid?: boolean }
export interface FeeDay { class_id: string; attendance_date: string; entries: FeeDayEntry[] }
export interface FeePayment { learner_id: string; fee_id: string; amount: number; kind: "advance" | "arrears"; paid_on: string }
export type Enrolment = Record<string, Record<string, boolean>>;

export function isEnrolled(enrolled: Enrolment, learnerId: string, fee: FeeItem): boolean {
  return enrolled[learnerId]?.[fee.id] ?? fee.default_on;
}

export interface DayTotals { cash: number; prepaid: number; owed: number; arrearsRecovered: number; advanceReceived: number }
export interface LearnerBalance { learnerId: string; feeId: string; debt: number; credit: number }

/** Replays attendance chronologically per learner and fee. Each present day costs the daily rate:
 * covered by advance credit first ("prepaid"), otherwise owed when marked No Money Today, else collected as cash. */
export function computeFees(fees: FeeItem[], days: FeeDay[], payments: FeePayment[], enrolled: Enrolment) {
  const sorted = [...days].sort((a, b) => a.attendance_date.localeCompare(b.attendance_date));
  const state = new Map<string, LearnerBalance>();
  const key = (l: string, f: string) => l + "|" + f;
  const get = (l: string, f: string) => { let s = state.get(key(l, f)); if (!s) { s = { learnerId: l, feeId: f, debt: 0, credit: 0 }; state.set(key(l, f), s); } return s; };
  const byDate = new Map<string, DayTotals>();
  const totals = (d: string) => { let t = byDate.get(d); if (!t) { t = { cash: 0, prepaid: 0, owed: 0, arrearsRecovered: 0, advanceReceived: 0 }; byDate.set(d, t); } return t; };
  const pays = [...payments].sort((a, b) => a.paid_on.localeCompare(b.paid_on));
  const perClass = new Map<string, DayTotals>();
  let pi = 0;
  const applyPaymentsUpTo = (date: string) => {
    while (pi < pays.length && pays[pi].paid_on <= date) {
      const p = pays[pi++]; const s = get(p.learner_id, p.fee_id); const t = totals(p.paid_on);
      if (p.kind === "advance") { s.credit += p.amount; t.advanceReceived += p.amount; }
      else { const used = Math.min(p.amount, s.debt); s.debt -= used; s.credit += p.amount - used; t.arrearsRecovered += p.amount; }
    }
  };
  for (const day of sorted) {
    applyPaymentsUpTo(day.attendance_date);
    const t = totals(day.attendance_date);
    const ck = day.attendance_date + "|" + day.class_id;
    const ct = perClass.get(ck) ?? { cash: 0, prepaid: 0, owed: 0, arrearsRecovered: 0, advanceReceived: 0 };
    for (const e of day.entries) {
      if (!e.present) continue;
      for (const fee of fees) {
        const rate = Number(fee.daily_rate);
        if (!rate || !isEnrolled(enrolled, e.id, fee)) continue;
        const s = get(e.id, fee.id);
        if (s.credit >= rate) { s.credit -= rate; t.prepaid += rate; ct.prepaid += rate; }
        else if (e.unpaid) { s.debt += rate; t.owed += rate; ct.owed += rate; }
        else { t.cash += rate; ct.cash += rate; }
      }
    }
    perClass.set(ck, ct);
  }
  applyPaymentsUpTo("9999-12-31");
  return {
    day: (date: string) => byDate.get(date) ?? { cash: 0, prepaid: 0, owed: 0, arrearsRecovered: 0, advanceReceived: 0 },
    classDay: (date: string, classId: string) => perClass.get(date + "|" + classId) ?? { cash: 0, prepaid: 0, owed: 0, arrearsRecovered: 0, advanceReceived: 0 },
    balances: [...state.values()],
  };
}

export function ghs(n: number) { return "GH₵ " + n.toFixed(2); }

export function whatsappPhone(phone: string): string | null {
  const d = phone.replace(/\D/g, "");
  if (/^0\d{9}$/.test(d)) return "233" + d.slice(1);
  if (/^233\d{9}$/.test(d)) return d;
  return null;
}
