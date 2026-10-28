import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { toast } from "sonner";
import { Wallet, Plus, Trash2, MessageCircle } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCloud } from "@/lib/cloud";
import { useAppData } from "@/lib/store";
import { supabase } from "@/integrations/supabase/client";
import { attendanceClasses, attendanceClassName } from "@/lib/attendance";
import { computeFees, ghs, isEnrolled, whatsappPhone, type Enrolment, type FeeDay, type FeeItem, type FeePayment, type RateOverrides } from "@/lib/fees";

export const Route = createFileRoute("/_authenticated/fees")({
  head: () => ({ meta: [
    { title: "Account Office — EduReport Ghana" },
    { name: "description", content: "Daily feeding and bus cash expected per class, arrears and advance payments for school owners." },
    { property: "og:title", content: "Account Office — EduReport Ghana" },
    { property: "og:description", content: "Private daily fee totals for school owners." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex, nofollow" },
  ] }),
  component: FeesPage,
});

type Tab = "today" | "learners" | "settings";

function FeesPage() {
  const cloud = useCloud();
  const { school } = useAppData();
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>("today");
  const [date, setDate] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const sid = cloud.schoolId;
  const isOwner = cloud.role === "headteacher";
  const data = useQuery({
    queryKey: ["fees", sid],
    enabled: Boolean(sid && isOwner),
    queryFn: async () => {
      if (!sid) throw new Error("Join School Cloud first");
      const ensure = await supabase.rpc("ensure_default_fees", { _school: sid });
      if (ensure.error) throw new Error(ensure.error.message);
      const [fees, profiles, pays, days, momo, pupils, early] = await Promise.all([
        supabase.from("fee_items").select("*").eq("school_id", sid).order("sort"),
        supabase.from("learner_fee_profiles").select("*").eq("school_id", sid),
        supabase.from("fee_payments").select("*").eq("school_id", sid).order("paid_on", { ascending: false }),
        supabase.from("daily_attendance").select("class_id,attendance_date,entries").eq("school_id", sid),
        supabase.from("school_fee_settings").select("*").eq("school_id", sid).maybeSingle(),
        supabase.from("school_students").select("id,class_id,data").eq("school_id", sid),
        supabase.from("attendance_early_learners").select("id,class_id,name").eq("school_id", sid),
      ]);
      for (const r of [fees, profiles, pays, days, momo, pupils, early]) if (r.error) throw new Error(r.error.message);
      const learners = [
        ...(pupils.data ?? []).map((p) => ({ id: p.id, classId: p.class_id, name: String((p.data as { name?: string }).name ?? "") })),
        ...(early.data ?? []).map((p) => ({ id: p.id, classId: p.class_id, name: p.name })),
      ].sort((a, b) => a.name.localeCompare(b.name));
      return {
        fees: (fees.data ?? []).map((f) => ({ ...f, daily_rate: Number(f.daily_rate) })) as FeeItem[],
        profiles: profiles.data ?? [],
        payments: (pays.data ?? []).map((p) => ({ ...p, amount: Number(p.amount) })) as (FeePayment & { id: string; method: string })[],
        days: (days.data ?? []) as unknown as FeeDay[],
        momo: momo.data, learners,
      };
    },
  });
  const refresh = () => qc.invalidateQueries({ queryKey: ["fees", sid] });
  const enrolled: Enrolment = useMemo(() => Object.fromEntries((data.data?.profiles ?? []).map((p) => [p.learner_id, p.enrolled as Record<string, boolean>])), [data.data]);
  const phones = useMemo(() => Object.fromEntries((data.data?.profiles ?? []).map((p) => [p.learner_id, p.parent_phone])), [data.data]);
  const overrides: RateOverrides = useMemo(() => Object.fromEntries((data.data?.profiles ?? []).map((p) => [p.learner_id, p.rate_overrides as Record<string, number>])), [data.data]);
  const result = useMemo(() => data.data ? computeFees(data.data.fees, data.data.days, data.data.payments, enrolled, overrides) : null, [data.data, enrolled, overrides]);

  if (!sid || !isOwner) return <Shell school={school}><p className="mt-6">Only the school owner or headteacher can open the Account Office. <Link to="/attendance" className="text-primary underline">Back to attendance</Link></p></Shell>;
  if (data.isPending) return <Shell school={school}><p role="status" className="py-10">Loading Account Office…</p></Shell>;
  if (data.error) return <Shell school={school}><div role="alert" className="mt-6 border-l-4 border-accent bg-muted p-4">{data.error.message.includes("owner") ? "Your 14-day trial has ended. Activate the School Cloud license to keep using the Account Office." : data.error.message}</div></Shell>;
  const d = data.data; const r = result;
  if (!d || !r) return <Shell school={school}><p role="status">Loading Account Office…</p></Shell>;
  const today = r.day(date);
  const classes = attendanceClasses(school.streams);
  const submitted = new Set(d.days.filter((x) => x.attendance_date === date).map((x) => x.class_id));
  const activeClasses = classes.filter((c) => d.learners.some((l) => l.classId === c));
  const learnerName = new Map(d.learners.map((l) => [l.id, l]));
  const feeName = new Map(d.fees.map((f) => [f.id, f.name]));

  return <Shell school={school}>
    <div className="mt-4 flex flex-wrap gap-1 border-b border-border">{(["today", "learners", "settings"] as Tab[]).map((t) => <Button variant="ghost" key={t} onClick={() => setTab(t)} className={`px-2 py-2 text-sm font-semibold ${tab === t ? "border-b-2 border-primary text-primary" : "text-muted-foreground"}`}>{t === "today" ? "Daily Cash" : t === "learners" ? "Learners & Debts" : "Fee Settings"}</Button>)}</div>

    {tab === "today" && <>
      <label className="mt-4 block max-w-xs text-sm font-semibold">Date<Input type="date" className="mt-2" value={date} max={format(new Date(), "yyyy-MM-dd")} onChange={(e) => e.target.value && setDate(e.target.value)} /></label>
      <div className="my-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[["Cash from teachers", today.cash], ["Unpaid today", today.owed], ["Covered by advance", today.prepaid], ["Arrears + advance paid", today.arrearsRecovered + today.advanceReceived]].map(([l, v]) => <div key={l as string} className="rounded-md border border-border p-3"><p className="text-xs text-muted-foreground">{l}</p><p className="num text-xl font-bold">{ghs(v as number)}</p></div>)}
      </div>
      <p className="mb-2 font-semibold">Class handover ({ghs(today.cash)} total cash expected)</p>
      <div className="divide-y divide-border border-y border-border">{activeClasses.map((c) => { const t = r.classDay(date, c); return <div key={c} className="flex flex-wrap items-center justify-between gap-2 py-3">
        <span className="font-semibold">{submitted.has(c) ? "✅" : "🕒"} {attendanceClassName(c)}</span>
        {submitted.has(c) ? <span className="text-sm">Cash <b>{ghs(t.cash)}</b> · Owed {ghs(t.owed)} · Prepaid {ghs(t.prepaid)}</span> : <Button asChild size="sm" variant="outline"><Link to="/attendance">Mark on behalf</Link></Button>}
      </div>; })}</div>
      {!activeClasses.length && <p className="text-muted-foreground">No learners registered yet.</p>}
    </>}

    {tab === "learners" && <LearnerFees d={d} overrides={overrides} enrolled={enrolled} phones={phones} balances={r.balances} sid={sid} schoolName={school.name} onDone={refresh} feeName={feeName} learnerName={learnerName} />}
    {tab === "settings" && <FeeSettings d={d} sid={sid} onDone={refresh} />}
  </Shell>;
}

function Shell({ school, children }: { school: { name: string; term: string; academicYear: string }; children: React.ReactNode }) {
  return <div className="min-h-screen bg-background pb-16"><AppHeader schoolName={school.name} term={school.term} year={school.academicYear} />
    <main className="mx-auto max-w-5xl px-4 py-6"><div className="flex items-center gap-3"><Wallet className="h-7 w-7 text-primary" /><h1 className="font-display text-2xl font-bold">Account Office</h1></div>
      <p className="mt-1 text-sm text-muted-foreground">Only you see these figures. Teachers just take attendance.</p>{children}</main></div>;
}

type Data = { fees: FeeItem[]; learners: { id: string; classId: string; name: string }[]; momo: { momo_network: string; momo_number: string; momo_name: string } | null; payments: (FeePayment & { id: string; method: string })[] };

function LearnerFees({ d, overrides, enrolled, phones, balances, sid, schoolName, onDone, feeName, learnerName }: { d: Data; overrides: RateOverrides; enrolled: Enrolment; phones: Record<string, string>; balances: { learnerId: string; feeId: string; debt: number; credit: number }[]; sid: string; schoolName: string; onDone: () => void; feeName: Map<string, string>; learnerName: Map<string, { name: string; classId: string }> }) {
  const [classId, setClassId] = useState(""); const [pay, setPay] = useState<{ learner: string; fee: string; amount: string; kind: "arrears" | "advance"; method: "cash" | "momo" } | null>(null);
  const classes = [...new Set(d.learners.map((l) => l.classId))];
  const cls = classId || classes[0] || "";
  const bal = (l: string, f: string) => balances.find((b) => b.learnerId === l && b.feeId === f);
  const saveProfile = useMutation({
    mutationFn: async (v: { learner: string; phone?: string; enrolled?: Record<string, boolean>; rates?: Record<string, number> }) => {
      // Patch only the edited field so phone, enrolment and rates cannot overwrite one another.
      const changes = { ...(v.phone !== undefined ? { parent_phone: v.phone.slice(0, 20) } : {}), ...(v.enrolled !== undefined ? { enrolled: v.enrolled } : {}), ...(v.rates !== undefined ? { rate_overrides: v.rates } : {}), updated_at: new Date().toISOString() };
      const existing = await supabase.from("learner_fee_profiles").upsert({ school_id: sid, learner_id: v.learner }, { onConflict: "school_id,learner_id", ignoreDuplicates: true });
      if (existing.error) throw new Error(existing.error.message);
      const { error } = await supabase.from("learner_fee_profiles").update(changes).eq("school_id", sid).eq("learner_id", v.learner);
      if (error) throw new Error(error.message);
    }, onSuccess: onDone, onError: (e) => toast.error(e.message),
  });
  const savePay = useMutation({
    mutationFn: async () => {
      if (!pay) throw new Error("Select a payment first");
      const amount = Number(pay.amount); if (!(amount > 0) || amount > 100000) throw new Error("Enter a valid amount");
      const { error } = await supabase.from("fee_payments").insert({ school_id: sid, learner_id: pay.learner, fee_id: pay.fee, amount, kind: pay.kind, method: pay.method });
      if (error) throw new Error(error.message);
    }, onSuccess: () => { setPay(null); toast.success("Payment recorded"); onDone(); }, onError: (e) => toast.error(e.message),
  });
  function remind(id: string) {
    const phone = whatsappPhone(phones[id] ?? ""); if (!phone) { toast.error("Add a valid parent phone first"); return; }
    const lines = d.fees.map((f) => ({ f, debt: bal(id, f.id)?.debt ?? 0 })).filter((x) => x.debt > 0).map((x) => `• ${x.f.name}: ${ghs(x.debt)}`);
    const total = d.fees.reduce((s, f) => s + (bal(id, f.id)?.debt ?? 0), 0);
    const momo = d.momo?.momo_number ? `\nPay via MoMo (${d.momo.momo_network}) ${d.momo.momo_number}${d.momo.momo_name ? ` — ${d.momo.momo_name}` : ""}.` : "";
    const msg = `Dear Parent, this is a kind reminder from ${schoolName || "the school"} about ${learnerName.get(id)?.name}'s outstanding fees:\n${lines.join("\n")}\nTotal: ${ghs(total)}.${momo}\nThank you.`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, "_blank", "noopener");
  }
  const rows = d.learners.filter((l) => l.classId === cls);
  return <div className="mt-4">
    <select aria-label="Class" className="h-11 w-full max-w-xs rounded-md border border-input bg-background px-3" value={cls} onChange={(e) => setClassId(e.target.value)}>{classes.map((c) => <option key={c} value={c}>{attendanceClassName(c)}</option>)}</select>
    <div className="mt-4 space-y-3">{rows.map((l) => { const totalDebt = d.fees.reduce((s, f) => s + (bal(l.id, f.id)?.debt ?? 0), 0); return <div key={l.id} className="space-y-2 rounded-lg border-2 border-border bg-muted/30 p-3 even:bg-card">
      <div className="flex flex-wrap items-center justify-between gap-2"><span className="font-semibold">{l.name}</span>{totalDebt > 0 ? <span className="text-sm font-bold text-destructive">Owes {ghs(totalDebt)}</span> : <span className="text-sm text-muted-foreground">No debt</span>}</div>
      <div className="flex flex-wrap items-center gap-2">
        {d.fees.map((f) => { const on = isEnrolled(enrolled, l.id, f); const b = bal(l.id, f.id); return <span key={f.id} className="inline-flex items-center gap-1">
          <Button size="sm" variant="outline" disabled={saveProfile.isPending} className={`rounded-full border px-3 py-1 text-xs font-semibold ${on ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`} onClick={() => saveProfile.mutate({ learner: l.id, enrolled: { ...(enrolled[l.id] ?? {}), [f.id]: !on } })}>{f.name}: {on ? "Yes" : "No"}</Button>
          {b && b.debt > 0 && <span className="text-xs text-destructive">−{ghs(b.debt)}</span>}{b && b.credit > 0 && <span className="text-xs text-primary">+{ghs(b.credit)}</span>}
        </span>; })}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">{d.fees.map((f) => {
        const custom = overrides[l.id]?.[f.id];
        return <label key={f.id} className="text-sm font-medium">{f.name} · GH₵/day
          <div className="mt-1 flex items-center gap-2">
            <Input key={`${l.id}-${f.id}-${custom ?? "general"}`} aria-label={`${f.name} rate for ${l.name}`} type="number" min="0" max="100000" step="0.01" placeholder={String(f.daily_rate)} defaultValue={custom ?? ""} disabled={saveProfile.isPending} className="h-9 w-28" onBlur={(e) => {
              const text = e.target.value.trim();
              const rates = { ...(overrides[l.id] ?? {}) };
              if (!text) { if (custom === undefined) return; delete rates[f.id]; }
              else { const amount = Number(text); if (!Number.isFinite(amount) || amount < 0 || amount > 100000 || Math.abs(amount * 100 - Math.round(amount * 100)) > 0.000001) { toast.error("Enter a valid rate with at most two decimal places"); e.target.value = custom === undefined ? "" : String(custom); return; } if (amount === custom) return; rates[f.id] = amount; }
              saveProfile.mutate({ learner: l.id, rates });
            }} />
            <span className="text-xs text-muted-foreground">{custom === undefined ? `General: ${ghs(f.daily_rate)}` : "Custom"}</span>
            {custom !== undefined && <Button size="sm" variant="ghost" disabled={saveProfile.isPending} onClick={() => { const rates = { ...(overrides[l.id] ?? {}) }; delete rates[f.id]; saveProfile.mutate({ learner: l.id, rates }); }}>Use general</Button>}
          </div>
        </label>;
      })}</div>
      <div className="flex flex-wrap items-center gap-2">
        <Input aria-label={`Parent phone for ${l.name}`} placeholder="Parent phone e.g. 0244123456" className="h-9 max-w-[200px]" defaultValue={phones[l.id] ?? ""} onBlur={(e) => { if (e.target.value !== (phones[l.id] ?? "")) saveProfile.mutate({ learner: l.id, phone: e.target.value }); }} />
        <Button size="sm" variant="outline" onClick={() => setPay({ learner: l.id, fee: d.fees[0]?.id ?? "", amount: "", kind: totalDebt > 0 ? "arrears" : "advance", method: "cash" })}><Plus />Record payment</Button>
        {totalDebt > 0 && <Button size="sm" variant="outline" onClick={() => remind(l.id)}><MessageCircle />WhatsApp reminder</Button>}
      </div>
      {pay?.learner === l.id && <form className="grid gap-2 rounded-md bg-muted p-3 sm:grid-cols-5" onSubmit={(e) => { e.preventDefault(); savePay.mutate(); }}>
        <select aria-label="Fee" className="h-9 rounded-md border border-input bg-background px-2" value={pay.fee} onChange={(e) => setPay({ ...pay, fee: e.target.value })}>{d.fees.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}</select>
        <select aria-label="Payment type" className="h-9 rounded-md border border-input bg-background px-2" value={pay.kind} onChange={(e) => setPay({ ...pay, kind: e.target.value as "arrears" | "advance" })}><option value="arrears">Paying debt</option><option value="advance">Advance (weekly/monthly)</option></select>
        <select aria-label="Method" className="h-9 rounded-md border border-input bg-background px-2" value={pay.method} onChange={(e) => setPay({ ...pay, method: e.target.value as "cash" | "momo" })}><option value="cash">Cash</option><option value="momo">MoMo</option></select>
        <Input aria-label="Amount" type="number" min="0.01" step="0.01" placeholder="GH₵" className="h-9" value={pay.amount} onChange={(e) => setPay({ ...pay, amount: e.target.value })} required />
        <div className="flex gap-1"><Button size="sm" type="submit" disabled={savePay.isPending}>Save</Button><Button size="sm" type="button" variant="ghost" onClick={() => setPay(null)}>Cancel</Button></div>
      </form>}
    </div>; })}</div>
    {d.payments.length > 0 && <><p className="mt-6 font-semibold">Recent payments</p><div className="divide-y divide-border text-sm">{d.payments.slice(0, 20).map((p) => <div key={p.id} className="flex justify-between py-2"><span>{p.paid_on} · {learnerName.get(p.learner_id)?.name} · {feeName.get(p.fee_id)} ({p.kind === "advance" ? "advance" : "debt"}, {p.method})</span><b>{ghs(p.amount)}</b></div>)}</div></>}
  </div>;
}

function FeeSettings({ d, sid, onDone }: { d: Data; sid: string; onDone: () => void }) {
  const [name, setName] = useState(""); const [rate, setRate] = useState("");
  const [momo, setMomo] = useState({ momo_network: d.momo?.momo_network ?? "MTN", momo_number: d.momo?.momo_number ?? "", momo_name: d.momo?.momo_name ?? "" });
  const run = useMutation({ mutationFn: async (fn: () => PromiseLike<{ error: { message: string } | null }>) => { const { error } = await fn(); if (error) throw new Error(error.message); }, onSuccess: () => { toast.success("Saved"); onDone(); }, onError: (e) => toast.error(e.message) });
  return <div className="mt-4 space-y-6">
    <div><p className="font-semibold">Daily fee rates</p><div className="mt-2 divide-y divide-border border-y border-border">{d.fees.map((f) => <div key={f.id} className="flex items-center gap-2 py-2">
      <span className="flex-1 font-semibold">{f.name}</span><span className="text-sm">GH₵</span>
      <Input aria-label={`${f.name} daily rate`} type="number" min="0" step="0.5" className="h-9 w-24" defaultValue={f.daily_rate} onBlur={(e) => { const v = Number(e.target.value); if (v >= 0 && v !== f.daily_rate) run.mutate(() => supabase.from("fee_items").update({ daily_rate: v }).eq("id", f.id)); }} />
      <Button size="icon" variant="ghost" aria-label={`Delete ${f.name}`} onClick={() => { if (window.confirm(`Delete ${f.name} and its payment records?`)) run.mutate(() => supabase.from("fee_items").delete().eq("id", f.id)); }}><Trash2 /></Button>
    </div>)}</div>
      <form className="mt-3 flex flex-wrap gap-2" onSubmit={(e) => { e.preventDefault(); run.mutate(() => supabase.from("fee_items").insert({ school_id: sid, name: name.trim().slice(0, 60), daily_rate: Number(rate) || 0, sort: d.fees.length })); setName(""); setRate(""); }}>
        <Input aria-label="New fee name" placeholder="e.g. Extra Classes" className="h-9 max-w-[200px]" value={name} onChange={(e) => setName(e.target.value)} required />
        <Input aria-label="New fee rate" type="number" min="0" step="0.5" placeholder="GH₵/day" className="h-9 w-28" value={rate} onChange={(e) => setRate(e.target.value)} />
        <Button size="sm" type="submit"><Plus />Add custom fee</Button>
      </form></div>
    <div><p className="font-semibold">School Mobile Money (shown on WhatsApp reminders)</p>
      <form className="mt-2 grid gap-2 sm:grid-cols-4" onSubmit={(e) => { e.preventDefault(); run.mutate(() => supabase.from("school_fee_settings").upsert({ school_id: sid, momo_network: momo.momo_network.slice(0, 20), momo_number: momo.momo_number.slice(0, 20), momo_name: momo.momo_name.slice(0, 80) })); }}>
        <select aria-label="MoMo network" className="h-9 rounded-md border border-input bg-background px-2" value={momo.momo_network} onChange={(e) => setMomo({ ...momo, momo_network: e.target.value })}>{["MTN", "Telecel", "AirtelTigo"].map((n) => <option key={n}>{n}</option>)}</select>
        <Input aria-label="MoMo number" placeholder="MoMo number" className="h-9" value={momo.momo_number} onChange={(e) => setMomo({ ...momo, momo_number: e.target.value })} />
        <Input aria-label="Account name" placeholder="Account name" className="h-9" value={momo.momo_name} onChange={(e) => setMomo({ ...momo, momo_name: e.target.value })} />
        <Button size="sm" type="submit">Save MoMo</Button>
      </form></div>
    <p className="text-xs text-muted-foreground">Rate changes apply to all calculations, including past days.</p>
  </div>;
}
