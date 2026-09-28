import { useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/lib/auth";
import { applyRemote, onLocalChange, DEFAULT_SCHOOL, type Student, type School } from "@/lib/store";
import { loadSchool, setCloud, useCloud, getCloud } from "@/lib/cloud";

/** Centralized school cloud: pushes every local edit and pulls live edits from other teachers. */
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
    const pending = new Map<string, Student | null>();
    let schoolPending: School | null = null;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const flush = async () => {
      const ups = [...pending.entries()].filter(([, v]) => v) as [string, Student][];
      const dels = [...pending.entries()].filter(([, v]) => !v).map(([k]) => k);
      const sch = schoolPending;
      pending.clear();
      schoolPending = null;
      try {
        if (ups.length) {
          const { error } = await supabase.from("school_students").upsert(
            ups.map(([, s]) => ({ id: s.id, school_id: schoolId, class_id: s.classId, data: s as never, updated_by: user.id, updated_at: new Date().toISOString() })),
          );
          if (error) throw error;
        }
        if (dels.length) {
          const { error } = await supabase.from("school_students").delete().in("id", dels);
          if (error) throw error;
        }
        if (sch) {
          const { error } = await supabase.from("schools").update({ name: sch.name, details: sch as never, updated_at: new Date().toISOString() }).eq("id", schoolId);
          if (error) throw error;
        }
        setCloud({ status: "synced", ...(sch?.name ? { schoolName: sch.name } : {}) });
      } catch {
        setCloud({ status: "offline" });
        toast.error("Could not save to the school cloud. Check your internet.");
      }
    };

    const off = onLocalChange((prev, next) => {
      const before = new Map(prev.students.map((s) => [s.id, s]));
      next.students.forEach((s) => { if (before.get(s.id) !== s) pending.set(s.id, s); before.delete(s.id); });
      before.forEach((_, id) => pending.set(id, null));
      if (prev.school !== next.school) schoolPending = next.school;
      if (pending.size || schoolPending) {
        setCloud({ status: "saving" });
        clearTimeout(timer);
        timer = setTimeout(flush, 700);
      }
    });

    const channel = supabase
      .channel(`school-${schoolId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "school_students", filter: `school_id=eq.${schoolId}` }, (p) => {
        if (p.eventType === "DELETE") {
          const id = (p.old as { id?: string }).id;
          if (id) applyRemote((cur) => ({ ...cur, students: cur.students.filter((s) => s.id !== id) }));
          return;
        }
        const row = p.new as { id: string; data: Student; updated_by: string | null };
        if (row.updated_by === user.id || pending.has(row.id)) return;
        applyRemote((cur) => {
          const exists = cur.students.some((s) => s.id === row.id);
          return { ...cur, students: exists ? cur.students.map((s) => (s.id === row.id ? row.data : s)) : [...cur.students, row.data] };
        });
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "schools", filter: `id=eq.${schoolId}` }, (p) => {
        if (schoolPending) return;
        const row = p.new as { name: string; details: Partial<School> };
        applyRemote((cur) => ({ ...cur, school: { ...DEFAULT_SCHOOL, ...row.details, name: row.details?.name || row.name } }));
        if (getCloud().schoolName !== row.name) setCloud({ schoolName: row.name });
      })
      .subscribe();

    return () => {
      off();
      clearTimeout(timer);
      if (pending.size || schoolPending) void flush();
      supabase.removeChannel(channel);
    };
  }, [user, schoolId]);

  return null;
}
