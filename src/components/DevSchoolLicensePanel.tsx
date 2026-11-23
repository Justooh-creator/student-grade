import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

type SchoolRow = {
  id: string; name: string; join_code: string; teacher_count: number;
  license_expires_at: string | null; license_permanent: boolean; license_terms: number | null;
  print_term_key: string | null; first_printed_at: string | null;
};
type Action = "term" | "year" | "expire" | "reset_lock";

const day = (d: string) => new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

function status(s: SchoolRow): { label: string; active: boolean } {
  if (s.license_permanent) return { label: "Active · permanent", active: true };
  if (s.license_expires_at && new Date(s.license_expires_at) > new Date()) {
    const terms = s.license_terms ?? 1;
    return { label: `Active · ${terms === 1 ? "1 term" : `${terms} terms`}`, active: true };
  }
  if (s.license_expires_at) return { label: "Expired", active: false };
  return { label: "Unpaid", active: false };
}

/** New expiry if a term/year is added now (extends from the current expiry when still active). */
function nextExpiry(s: SchoolRow, days: number): string {
  const cur = s.license_expires_at ? new Date(s.license_expires_at).getTime() : 0;
  return day(new Date(Math.max(cur, Date.now()) + days * 86400000).toISOString());
}

/** Developer-only one-tap license manager for every registered school. Renders nothing for others. */
export function DevSchoolLicensePanel() {
  const [isDev, setIsDev] = useState(false);
  const [rows, setRows] = useState<SchoolRow[]>([]);
  const [selected, setSelected] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const { data, error } = await supabase.rpc("dev_list_schools");
    if (error) { toast.error("Could not load schools."); return; }
    const list = (data as SchoolRow[]) ?? [];
    setRows(list);
    setSelected((cur) => (cur && list.some((r) => r.id === cur) ? cur : list[0]?.id ?? ""));
  };

  useEffect(() => {
    supabase.rpc("is_developer").then(({ data }) => { if (data) { setIsDev(true); load(); } });
  }, []);

  if (!isDev) return null;
  const s = rows.find((r) => r.id === selected);

  const run = async (action: Action) => {
    if (!s) return;
    const ask: Record<Action, string> = {
      term: `Activate 1 term for ${s.name}? New expiry: ${nextExpiry(s, 100)}.`,
      year: `Activate 1 year (3 terms) for ${s.name}? New expiry: ${nextExpiry(s, 365)}.`,
      expire: `Expire ${s.name}'s license NOW? Every teacher in this school will lose Save/Print immediately.`,
      reset_lock: `Reset the print lock for ${s.name}? The license dates stay the same.`,
    };
    if (!window.confirm(ask[action])) return;
    setBusy(true);
    const { error } = await supabase.rpc("dev_set_school_license", { _school: s.id, _action: action });
    setBusy(false);
    if (error) { toast.error("Could not update this school's license."); return; }
    toast.success(action === "expire" ? "License expired" : action === "reset_lock" ? "Print lock cleared" : "License activated");
    load();
  };

  const st = s ? status(s) : null;
  return (
    <section className="rounded-lg border-2 border-amber-400 bg-card p-4 shadow-sm">
      <h2 className="mb-1 font-display text-base font-bold text-primary">🛠️ Developer: School licenses</h2>
      <label className="block text-sm font-bold">Registered schools ({rows.length})
        <select aria-label="Registered schools" value={selected} onChange={(e) => setSelected(e.target.value)}
          className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
          {rows.map((r) => (
            <option key={r.id} value={r.id}>{r.name || "Unnamed school"} · {r.join_code} · {r.teacher_count} teacher{r.teacher_count === 1 ? "" : "s"}</option>
          ))}
        </select>
      </label>
      {s && st && (
        <>
          <dl className="mt-3 grid gap-1 rounded-md border border-border p-3 text-sm">
            <div className="flex justify-between gap-2"><dt className="text-muted-foreground">Status</dt><dd className={`font-bold ${st.active ? "text-primary" : "text-destructive"}`}>{st.label}</dd></div>
            <div className="flex justify-between gap-2"><dt className="text-muted-foreground">Expiry date</dt><dd className="font-semibold">{s.license_permanent ? "Never" : s.license_expires_at ? day(s.license_expires_at) : "—"}</dd></div>
            <div className="flex justify-between gap-2"><dt className="text-muted-foreground">Print lock</dt><dd className="text-right font-semibold">{s.print_term_key ? `Locked to ${s.print_term_key}` : "Open"}</dd></div>
            <div className="flex justify-between gap-2"><dt className="text-muted-foreground">First print</dt><dd className="font-semibold">{s.first_printed_at ? day(s.first_printed_at) : "—"}</dd></div>
          </dl>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Button disabled={busy} onClick={() => run("term")}>Activate 1 Term</Button>
            <Button disabled={busy} onClick={() => run("year")}>Activate 1 Year</Button>
            <Button disabled={busy} variant="outline" onClick={() => run("reset_lock")}>Reset print lock</Button>
            <Button disabled={busy} variant="destructive" onClick={() => run("expire")}>Expire now</Button>
          </div>
        </>
      )}
      {rows.length === 0 && <p className="mt-2 text-sm text-muted-foreground">No schools registered yet.</p>}
      <p className="mt-2 text-xs text-muted-foreground">Only visible to the developer account. 1 term = 100 days, 1 year = 365 days, added on top of any days left.</p>
    </section>
  );
}
