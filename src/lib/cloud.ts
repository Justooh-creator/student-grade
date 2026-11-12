import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { applyRemote, getData, DEFAULT_SCHOOL, stripSchoolImages, stripStudentImages, keepLocalSchoolImages, keepLocalStudentPhoto, type Student, type School } from "./store";
import { queueKey, readMembership, readQueue, writeMembership } from "./syncQueue";
import { rebase, type SyncQueue } from "./syncMerge";

export interface CloudState {
  status: "signed-out" | "loading" | "no-school" | "synced" | "saving" | "offline";
  schoolId?: string;
  schoolName?: string;
  joinCode?: string;
  role?: string;
  userId?: string;
  /** School taken from this device's last successful sign-in because the cloud could not be reached. */
  cached?: boolean;
}

let state: CloudState = { status: "signed-out" };
const listeners = new Set<() => void>();
export function setCloud(patch: Partial<CloudState>, replace = false) {
  state = replace ? (patch as CloudState) : { ...state, ...patch };
  listeners.forEach((l) => l());
}
export function getCloud() { return state; }
export function useCloud() {
  // Start from the server-safe default so SSR and first client render match; the effect syncs real state.
  const [s, set] = useState<CloudState>({ status: "signed-out" });
  useEffect(() => {
    const l = () => set(state);
    listeners.add(l);
    l();
    return () => { listeners.delete(l); };
  }, []);
  return s;
}

const BACKUP_KEY = "sba-local-backup";

/**
 * Combine cloud learner rows with this device's unsent edits: pending marks are shown on top of
 * the cloud copy, pending removals stay removed and learners not yet uploaded stay on the list.
 */
export function withPendingEdits(local: Student[], remote: Student[], q: SyncQueue): Student[] {
  const byId = new Map(local.map((s) => [s.id, s]));
  const merged = remote
    .filter((s) => !q.students[s.id]?.delete)
    .map((s) => keepLocalStudentPhoto(byId.get(s.id), rebase(s, q.students[s.id])));
  const have = new Set(merged.map((s) => s.id));
  for (const c of Object.values(q.students)) {
    if (!c.create || have.has(c.id)) continue;
    const keep = byId.get(c.id) ?? c.snapshot;
    if (keep) merged.push(keep);
  }
  return merged;
}

/** Load the teacher's school membership and pull all records from the cloud. */
export async function loadSchool(userId: string) {
  setCloud({ status: "loading" }, true);
  // No internet: keep working with the school remembered on this device so edits are still queued.
  const offline = () => {
    const cached = readMembership(userId);
    setCloud(cached ? { status: "offline", ...cached, userId, cached: true } : { status: "offline" }, true);
    return cached?.schoolId ?? null;
  };
  const { data: m, error: mErr } = await supabase.from("school_members").select("school_id, role").eq("user_id", userId).maybeSingle();
  if (mErr) return offline();
  if (!m) { writeMembership(userId, null); setCloud({ status: "no-school" }, true); return null; }
  const [{ data: school, error: sErr }, { data: rows, error: rErr }] = await Promise.all([
    supabase.from("schools").select("*").eq("id", m.school_id).single(),
    supabase.from("school_students").select("data").eq("school_id", m.school_id),
  ]);
  if (!school || sErr || rErr) return offline();
  // Keep a one-time backup of what was on this phone before joining the cloud.
  if (!localStorage.getItem(BACKUP_KEY)) {
    localStorage.setItem(BACKUP_KEY, JSON.stringify(getData()));
  }
  const details = (school.details ?? {}) as Partial<School>;
  const pending = readQueue(queueKey(userId, school.id));
  applyRemote((cur) => ({
    school: keepLocalSchoolImages(cur.school, { ...DEFAULT_SCHOOL, ...details, name: details.name || school.name }),
    students: withPendingEdits(cur.students, (rows ?? []).map((r) => r.data as unknown as Student), pending),
  }));
  writeMembership(userId, { schoolId: school.id, schoolName: school.name, joinCode: school.join_code, role: m.role });
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
      students.map((st) => ({ id: st.id, school_id: s.schoolId!, class_id: st.classId, data: stripStudentImages(st) as never, updated_by: userId })),
    );
    if (error) throw error;
  }
  if (b?.school?.name) {
    const cur = getData().school;
    if (!cur.name) {
      await supabase.from("schools").update({ name: b.school.name, details: stripSchoolImages(b.school) as never, updated_at: new Date().toISOString() }).eq("id", s.schoolId);
    }
  }
  localStorage.setItem(BACKUP_KEY, JSON.stringify({ school: b?.school, students: [] }));
  await loadSchool(userId);
  return students.length;
}
