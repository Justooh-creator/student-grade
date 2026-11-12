import { useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { useUser } from "@/lib/auth";
import { applyRemote, onLocalChange, DEFAULT_SCHOOL, stripSchoolImages, keepLocalSchoolImages, keepLocalStudentPhoto, type Student, type School } from "@/lib/store";
import { loadSchool, setCloud, useCloud, getCloud } from "@/lib/cloud";
import { rebase, type SyncResult } from "@/lib/syncMerge";
import { flushQueue, pendingCount, queueKey, readQueue, recordLocalChange, type SyncTransport } from "@/lib/syncQueue";

export const SYNC_CONFLICTS_EVENT = "edureport:sync-conflicts";

/**
 * Centralized school cloud. Learner edits are queued on this device box-by-box and sent to the
 * server, which merges them field by field and flags same-box clashes for review.
 */
export function SyncListener() {
  const { user, ready } = useUser();
  const cloud = useCloud();

  useEffect(() => {
    if (!ready) return;
    if (!user) { setCloud({ status: "signed-out" }, true); return; }
    loadSchool(user.id);
  }, [user, ready]);

  const schoolId = cloud.schoolId;
  useEffect(() => {
    if (!user || !schoolId) return;
    const key = queueKey(user.id, schoolId);
    let schoolPending: School | null = null;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let warned = false;

    const transport: SyncTransport = async (changes) => {
      const { data, error } = await supabase.rpc("sync_student_changes", { _school: schoolId, _changes: changes as unknown as Json });
      if (error) throw error;
      return ((data as { results?: SyncResult[] } | null)?.results ?? []);
    };

    const applyResults = (results: SyncResult[]) => {
      const q = readQueue(key);
      const byId = new Map(results.map((r) => [r.id, r]));
      applyRemote((cur) => ({
        ...cur,
        students: cur.students
          .filter((s) => byId.get(s.id)?.status !== "missing")
          .map((s) => {
            const r = byId.get(s.id);
            return r?.status === "ok" && r.data ? keepLocalStudentPhoto(s, rebase(r.data, q.students[s.id])) : s;
          }),
      }));
      const clashes = results.reduce((n, r) => n + (r.conflicts?.length ?? 0) + (r.status === "missing" ? 1 : 0), 0);
      if (clashes) {
        toast.warning(`${clashes} ${clashes === 1 ? "mark was" : "marks were"} changed by another teacher at the same time. Tap "Review" to choose which to keep.`, { duration: 8000 });
        window.dispatchEvent(new Event(SYNC_CONFLICTS_EVENT));
      }
      if (results.some((r) => r.status === "rejected")) toast.error("One learner could not be saved to this school's cloud. It is still on this phone.");
      if (results.some((r) => r.invalid?.length)) toast.error("Some marks were outside the allowed range and were not saved to the cloud.");
    };

    const schedule = (ms: number) => { clearTimeout(timer); timer = setTimeout(() => void flush(), ms); };

    const flush = async () => {
      clearTimeout(timer);
      const sch = schoolPending;
      schoolPending = null;
      try {
        const results = await flushQueue(key, transport);
        if (results) applyResults(results);
        if (sch) {
          const { error } = await supabase.from("schools").update({ name: sch.name, details: stripSchoolImages(sch) as never, updated_at: new Date().toISOString() }).eq("id", schoolId);
          if (error) throw error;
        }
        warned = false;
        const left = pendingCount(readQueue(key)) > 0 || !!schoolPending;
        setCloud({ status: left ? "saving" : "synced", ...(sch?.name ? { schoolName: sch.name } : {}) });
        if (left) schedule(1500);
      } catch {
        if (sch && !schoolPending) schoolPending = sch; // keep it for the next attempt
        setCloud({ status: "offline" });
        if (!warned && (typeof navigator === "undefined" || navigator.onLine)) {
          warned = true;
          toast.error("Could not reach the school cloud. Your changes are saved on this phone and will sync automatically.");
        }
        schedule(20000);
      }
    };

    const off = onLocalChange((prev, next) => {
      if (prev.students !== next.students) recordLocalChange(key, prev.students, next.students);
      if (prev.school !== next.school) schoolPending = next.school;
      if (pendingCount(readQueue(key)) || schoolPending) {
        setCloud({ status: "saving" });
        schedule(700);
      }
    });

    // Back online: send pending edits, then pull anything other teachers changed meanwhile.
    const onOnline = () => { void flush().then(() => { if (getCloud().cached || getCloud().status !== "offline") void loadSchool(user.id); }); };
    window.addEventListener("online", onOnline);
    // Edits left from an earlier session (app closed or no internet) are retried right away.
    if (pendingCount(readQueue(key))) { setCloud({ status: "saving" }); schedule(300); }

    const channel = supabase
      .channel(`school-${schoolId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "school_students", filter: `school_id=eq.${schoolId}` }, (p) => {
        const q = readQueue(key);
        if (p.eventType === "DELETE") {
          const id = (p.old as { id?: string }).id;
          if (!id) return;
          const ch = q.students[id];
          // This device still has unsent edits for the learner: the server keeps a copy for review.
          if (ch && !ch.delete && Object.keys(ch.ops).length) { schedule(300); return; }
          applyRemote((cur) => ({ ...cur, students: cur.students.filter((s) => s.id !== id) }));
          return;
        }
        const row = p.new as { id: string; data: Student };
        if (q.students[row.id]?.delete) return;
        applyRemote((cur) => {
          const local = cur.students.find((s) => s.id === row.id);
          const merged = keepLocalStudentPhoto(local, rebase(row.data, q.students[row.id]));
          return { ...cur, students: local ? cur.students.map((s) => (s.id === row.id ? merged : s)) : [...cur.students, merged] };
        });
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "schools", filter: `id=eq.${schoolId}` }, (p) => {
        if (schoolPending) return;
        const row = p.new as { name: string; details: Partial<School> };
        applyRemote((cur) => ({ ...cur, school: keepLocalSchoolImages(cur.school, { ...DEFAULT_SCHOOL, ...row.details, name: row.details?.name || row.name }) }));
        if (getCloud().schoolName !== row.name) setCloud({ schoolName: row.name });
      })
      .subscribe();

    return () => {
      off();
      clearTimeout(timer);
      window.removeEventListener("online", onOnline);
      if (pendingCount(readQueue(key)) || schoolPending) void flush();
      supabase.removeChannel(channel);
    };
  }, [user, schoolId]);

  return null;
}
