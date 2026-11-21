import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

type Row = { id: string; email: string; display_name: string; created_at: string };

const daysAgo = (d: string) => {
  const n = Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
  return n <= 0 ? "today" : n === 1 ? "1 day ago" : `${n} days ago`;
};

/** Developer-only list of accounts whose email is not yet verified. Renders nothing for others. */
export function DevUnverifiedPanel() {
  const [isDev, setIsDev] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  const load = async () => {
    const { data, error } = await supabase.rpc("dev_unverified_users");
    if (!error) setRows((data as Row[]) ?? []);
  };

  useEffect(() => {
    supabase.rpc("is_developer").then(({ data }) => { if (data) { setIsDev(true); load(); } });
  }, []);

  if (!isDev) return null;

  const resend = async (r: Row) => {
    setBusy(r.id);
    const { error } = await supabase.auth.resend({ type: "signup", email: r.email, options: { emailRedirectTo: `${window.location.origin}/verified` } });
    setBusy(null);
    if (error) toast.error("Could not resend. Try again later."); else toast.success(`Verification link sent to ${r.email}`);
  };
  const confirm = async (r: Row) => {
    if (!window.confirm(`Mark ${r.email} as verified?`)) return;
    setBusy(r.id);
    const { error } = await supabase.rpc("dev_confirm_user", { _user: r.id });
    setBusy(null);
    if (error) { toast.error("Could not confirm this account."); return; }
    toast.success("Account verified");
    load();
  };
  const copy = async (r: Row) => {
    try { await navigator.clipboard.writeText(r.email); toast.success("Email copied"); } catch { toast.error("Could not copy"); }
  };

  return (
    <section className="rounded-lg border-2 border-amber-400 bg-card p-4 shadow-sm">
      <h2 className="mb-1 font-display text-base font-bold text-primary">🛠️ Developer: Email verification reminder</h2>
      <p className="text-sm font-semibold">
        {rows.length === 0 ? "✅ All accounts are verified." : `⚠️ ${rows.length} account${rows.length === 1 ? "" : "s"} not yet verified`}
      </p>
      <div className="mt-3 grid gap-2">
        {rows.map((r) => (
          <div key={r.id} className="rounded-md border border-border p-3 text-sm">
            <p className="font-bold">{r.display_name || "—"}</p>
            <p className="break-all text-muted-foreground">{r.email}</p>
            <p className="text-xs text-muted-foreground">Signed up {daysAgo(r.created_at)} · {new Date(r.created_at).toLocaleDateString()}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Button size="sm" disabled={busy === r.id} onClick={() => resend(r)}>Resend link</Button>
              <Button size="sm" variant="outline" disabled={busy === r.id} onClick={() => confirm(r)}>Confirm email</Button>
              <Button size="sm" variant="ghost" onClick={() => copy(r)}>Copy email</Button>
            </div>
          </div>
        ))}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">Only visible to the developer account.</p>
    </section>
  );
}
