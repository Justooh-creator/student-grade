import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { applyRemote, getData, DEFAULT_SCHOOL, type Student, type School } from "./store";

export interface CloudState {
  status: "signed-out" | "loading" | "no-school" | "synced" | "saving" | "offline";
  schoolId?: string;
  schoolName?: string;
  joinCode?: string;
  role?: string;
  userId?: string;
}

let state: CloudState = { status: "signed-out" };
const listeners = new Set<() => void>();
export function setCloud(patch: Partial<CloudState>, replace = false) {
  state = replace ? (patch as CloudState) : { ...state, ...patch };
  listeners.forEach((l) => l());
}
export function getCloud() { return state; }
export function useCloud() {
  const [s, set] = useState(state);
  useEffect(() => {
    const l = () => set(state);
    listeners.add(l);
    l();
    return () => { listeners.delete(l); };
  }, []);
  return s;
}

const BACKUP_KEY = "sba-local-backup";

/** Load the teacher's school membership and pull all records from the cloud. */
export async function loadSchool(userId: string) {
  setCloud({ status: "loading" }, true);
  const { data: m } = await supabase.from("school_members").select("school_id, role").eq("user_id", userId).maybeSingle();
  if (!m) { setCloud({ status: "no-school" }, true); return null; }
  const [{ data: school }, { data: rows }] = await Promise.all([
    supabase.from("schools").select("*").eq("id", m.school_id).single(),
    supabase.from("school_students").select("data").eq("school_id", m.school_id),
  ]);
  if (!school) { setCloud({ status: "offline" }, true); return null; }
  // Keep a one-time backup of what was on this phone before joining the cloud.
  if (!localStorage.getItem(BACKUP_KEY)) {
    localStorage.setItem(BACKUP_KEY, JSON.stringify(getData()));
  }
  const details = (school.details ?? {}) as Partial<School>;
  applyRemote(() => ({
    school: { ...DEFAULT_SCHOOL, ...details, name: details.name || school.name },
    students: (rows ?? []).map((r) => r.data as unknown as Student),
  }));
  setCloud({ status: "synced", schoolId: school.id, schoolName: school.name, joinCode: school.join_code, role: m.role, userId }, true);
  return school.id;
}

export function hasLocalBackup() {
  try {
    const b = JSON.parse(localStorage.getItem(BACKUP_KEY) || "null");
    return b && Array.isArray(b.students) && b.students.length > 0 ? (b.students as Student[]).length : 0;
  } catch { return 0; }
}

/** Upload the records that were on this phone before joining the school cloud. */
export async function uploadLocalBackup(userId: string) {
  const s = getCloud();
  if (!s.schoolId) throw new Error("Join a school first");
  const b = JSON.parse(localStorage.getItem(BACKUP_KEY) || "null") as { school?: School; students?: Student[] } | null;
  const students = b?.students ?? [];
  if (students.length) {
    const { error } = await supabase.from("school_students").upsert(
      students.map((st) => ({ id: st.id, school_id: s.schoolId!, class_id: st.classId, data: st as never, updated_by: userId })),
    );
    if (error) throw error;
  }
  if (b?.school?.name) {
    const cur = getData().school;
    if (!cur.name) {
      await supabase.from("schools").update({ name: b.school.name, details: b.school as never, updated_at: new Date().toISOString() }).eq("id", s.schoolId);
    }
  }
  localStorage.setItem(BACKUP_KEY, JSON.stringify({ school: b?.school, students: [] }));
  await loadSchool(userId);
  return students.length;
}
