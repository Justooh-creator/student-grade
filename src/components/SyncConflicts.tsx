import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { useCloud } from "@/lib/cloud";
import { useUser } from "@/lib/auth";
import { getData, updateData, type Student } from "@/lib/store";
import { fieldLabel, withField, type Json } from "@/lib/syncMerge";
import { SYNC_CONFLICTS_EVENT } from "@/components/SyncListener";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type Conflict = Tables<"student_sync_conflicts">;

const show = (v: Json) => (v === null || v === "" ? "blank" : typeof v === "object" ? JSON.stringify(v) : String(v));

/**
 * Lists marks two teachers changed differently while offline. Nothing is overwritten until the
 * teacher who made the edit (or the school admin) chooses which version to keep.
 */
export function SyncConflicts() {
  const cloud = useCloud();
  const { user } = useUser();
  const [items, setItems] = useState<Conflict[]>([]);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const schoolId = cloud.schoolId;

  const load = useCallback(async () => {
    if (!schoolId || !user) { setItems([]); return; }
    const { data } = await supabase.from("student_sync_conflicts").select("*").eq("school_id", schoolId).is("resolved_at", null).order("raised_at");
    setItems(data ?? []);
  }, [schoolId, user]);

  useEffect(() => {
    void load();
    const again = () => void load();
    window.addEventListener(SYNC_CONFLICTS_EVENT, again);
    window.addEventListener("online", again);
    return () => { window.removeEventListener(SYNC_CONFLICTS_EVENT, again); window.removeEventListener("online", again); };
  }, [load]);

  const resolve = async (c: Conflict, resolution: "kept_cloud" | "used_local" | "restored" | "kept_deleted") => {
    setBusy(c.id);
    try {
      if (resolution === "used_local") {
        const found = getData().students.some((s) => s.id === c.student_id);
        if (!found) throw new Error("This learner is no longer on the list.");
        // Goes through the normal sync, so it is still checked against the latest cloud mark.
        updateData((cur) => ({ ...cur, students: cur.students.map((s) => (s.id === c.student_id ? withField(s, c.path, c.local_value as Json) : s)) }));
      }
      if (resolution === "restored") {
        const copy = c.local_value as unknown as Student | null;
        if (!copy || typeof copy !== "object") throw new Error("No saved copy of this learner.");
        updateData((cur) => (cur.students.some((s) => s.id === c.student_id) ? cur : { ...cur, students: [...cur.students, { ...copy, id: c.student_id }] }));
      }
      const { error } = await supabase.from("student_sync_conflicts").update({ resolved_at: new Date().toISOString(), resolved_by: user?.id ?? null, resolution }).eq("id", c.id);
      if (error) throw error;
      setItems((list) => list.filter((x) => x.id !== c.id));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save your choice. Try again.");
    } finally {
      setBusy(null);
    }
  };

  if (!items.length) return null;
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="no-print fixed bottom-14 right-3 z-50 rounded-full bg-destructive px-3 py-2 text-xs font-semibold text-destructive-foreground shadow-lg print:hidden"
      >
        ⚠ {items.length} {items.length === 1 ? "mark needs" : "marks need"} review
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Marks to review</DialogTitle>
            <DialogDescription>
              These were changed by two teachers at the same time. The cloud kept the first one; your offline entry is saved here. Choose which to keep.
            </DialogDescription>
          </DialogHeader>
          <ul className="space-y-3">
            {items.map((c) => (
              <li key={c.id} className="rounded-md border border-border p-3 text-sm">
                <p className="font-semibold">{c.student_name || "Learner"}</p>
                {c.kind === "deleted" ? (
                  <>
                    <p className="text-muted-foreground">Another teacher removed this learner while you were editing offline.</p>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <Button size="sm" variant="outline" disabled={busy === c.id} onClick={() => resolve(c, "kept_deleted")}>Keep removed</Button>
                      <Button size="sm" disabled={busy === c.id} onClick={() => resolve(c, "restored")}>Restore learner</Button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-muted-foreground">{fieldLabel(c.path)}</p>
                    <div className="mt-1 grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded bg-muted px-2 py-1">In the cloud: <b>{show(c.cloud_value as Json)}</b></div>
                      <div className="rounded bg-muted px-2 py-1">{c.raised_by === user?.id ? "Your entry" : "Offline entry"}: <b>{show(c.local_value as Json)}</b></div>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <Button size="sm" variant="outline" disabled={busy === c.id} onClick={() => resolve(c, "kept_cloud")}>Keep cloud</Button>
                      <Button size="sm" disabled={busy === c.id} onClick={() => resolve(c, "used_local")}>Use offline entry</Button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        </DialogContent>
      </Dialog>
    </>
  );
}
