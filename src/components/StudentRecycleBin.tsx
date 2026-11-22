import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { getClassLevel, type ClassId } from "@/lib/ges";
import { daysUntilPurge, headCanRestore, HEAD_RESTORE_DAYS } from "@/lib/recycleBin";
import { loadSchool } from "@/lib/cloud";

type Row = {
  id: string; student_name: string; class_id: string; deleted_by_name: string; deleted_by_email: string;
  deleted_at: string; restored_at: string | null; restored_by_name: string | null;
  school_id?: string; school_name?: string;
};

const when = (d: string) => new Date(d).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
const className = (c: string) => (c ? getClassLevel(c as ClassId).name : "—");
const DEV_WHATSAPP = "https://wa.me/233530887628";

/**
 * Deleted learners. "head" shows one school's bin (self-restore for 14 days);
 * "developer" shows every school (restore for 30 days). Saved copies are removed after 30 days.
 */
export function StudentRecycleBin({ mode, schoolId, userId }: { mode: "head" | "developer"; schoolId?: string; userId?: string }) {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    const res = mode === "developer"
      ? await supabase.rpc("dev_deleted_students")
      : await supabase.rpc("list_deleted_students", { _school: schoolId! });
    if (res.error) { setError(true); setRows([]); return; }
    setError(false);
    setRows((res.data as Row[]) ?? []);
  }, [mode, schoolId]);

  useEffect(() => { if (mode === "developer" || schoolId) void load(); }, [load, mode, schoolId]);

  const restore = async (r: Row) => {
    if (!window.confirm(`Restore ${r.student_name || "this learner"} to ${className(r.class_id)} with all their previous marks and records?`)) return;
    setBusy(r.id);
    const { error: err } = await supabase.rpc("restore_deleted_student", { _id: r.id });
    setBusy(null);
    if (err) { toast.error(err.message || "Could not restore this learner."); return; }
    toast.success(`${r.student_name || "Learner"} restored to ${className(r.class_id)}`);
    if (userId && mode === "head") void loadSchool(userId);
    void load();
  };

  const waiting = rows?.filter((r) => !r.restored_at) ?? [];
  const restored = rows?.filter((r) => r.restored_at) ?? [];

  const card = (r: Row) => {
    const left = daysUntilPurge(r.deleted_at);
    const headOk = headCanRestore(r.deleted_at);
    const canRestore = !r.restored_at && (mode === "developer" || headOk);
    return (
      <div key={r.id} className="rounded-md border border-border p-3 text-sm">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2">
          <div className="min-w-0">
            <p className="truncate font-bold">{r.student_name || "Unnamed learner"}</p>
            {mode === "developer" && <p className="truncate text-xs font-semibold text-primary">{r.school_name || "Unknown school"}</p>}
            <p className="text-muted-foreground">{className(r.class_id)} · Deleted by {r.deleted_by_name || r.deleted_by_email || "unknown"}</p>
            {mode === "developer" && r.deleted_by_email && <p className="break-all text-xs text-muted-foreground">{r.deleted_by_email}</p>}
            <p className="text-xs text-muted-foreground">{when(r.deleted_at)}</p>
          </div>
          {!r.restored_at && (
            <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold ${left <= 5 ? "bg-destructive/15 text-destructive" : "bg-muted text-foreground"}`}>
              {left} day{left === 1 ? "" : "s"} left
            </span>
          )}
        </div>
        {r.restored_at ? (
          <p className="mt-2 text-xs font-semibold text-primary">✅ Restored {when(r.restored_at)}{r.restored_by_name ? ` by ${r.restored_by_name}` : ""}</p>
        ) : canRestore ? (
          <Button size="sm" className="mt-2" disabled={busy === r.id} onClick={() => restore(r)}>{busy === r.id ? "Restoring…" : "♻️ Restore learner"}</Button>
        ) : (
          <p className="mt-2 text-xs">
            Beyond {HEAD_RESTORE_DAYS} days — <a href={`${DEV_WHATSAPP}?text=${encodeURIComponent(`Hello, please recover ${r.student_name} (${className(r.class_id)}) deleted on ${when(r.deleted_at)}.`)}`} target="_blank" rel="noreferrer" className="font-bold text-primary underline">contact the developer to recover</a>.
          </p>
        )}
      </div>
    );
  };

  return (
    <section className={`rounded-lg border bg-card p-4 shadow-sm ${mode === "developer" ? "border-2 border-amber-400" : "border-border"}`}>
      <h2 className="font-display text-base font-bold text-primary">{mode === "developer" ? "🛠️ Developer: Deleted learners (all schools)" : "♻️ Student Recycle Bin"}</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        {mode === "developer"
          ? "Every deletion in the last 30 days, with school, class, who deleted and when. You can restore any of them."
          : `Recently deleted learners from your school. You can restore them within ${HEAD_RESTORE_DAYS} days; after 30 days they are removed for good.`}
      </p>
      {rows === null ? (
        <p className="mt-3 text-sm text-muted-foreground">Loading…</p>
      ) : error ? (
        <p className="mt-3 text-sm text-destructive">Could not load deleted learners. Check your internet and try again.</p>
      ) : rows.length === 0 ? (
        <p className="mt-3 text-sm">✅ No learners deleted in the last 30 days.</p>
      ) : (
        <div className="mt-3 grid gap-2">
          {waiting.map(card)}
          {restored.length > 0 && <p className="mt-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">Restored</p>}
          {restored.map(card)}
        </div>
      )}
      <Button variant="outline" size="sm" className="mt-3" onClick={() => void load()}>🔄 Refresh</Button>
    </section>
  );
}

/** Developer-only wrapper: renders nothing for everyone else. */
export function DevRecycleBin() {
  const [isDev, setIsDev] = useState(false);
  useEffect(() => { supabase.rpc("is_developer").then(({ data }) => setIsDev(!!data)); }, []);
  return isDev ? <StudentRecycleBin mode="developer" /> : null;
}
