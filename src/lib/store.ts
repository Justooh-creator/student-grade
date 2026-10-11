import { useCallback, useEffect, useState } from "react";
import type { ClassId } from "./ges";

export interface School {
  name: string;
  address: string;
  term: string;
  academicYear: string;
  reopeningDate: string;
  /** Date school vacates (end of term). */
  vacationDate?: string;
  classTeacher: string;
  headTeacher: string;
  totalAttendance: string;
  region: string;
  district: string;
  logo: string;
  signature?: string;
  /** School stamp — photo with ink extracted, printed between the signatures. */
  stamp?: string;
  motto?: string;
  emisCode?: string;
  /** class id -> class teacher name(s) */
  classTeachers?: Record<string, string>;
  /** class id -> class teacher signature image */
  classTeacherSignatures?: Record<string, string>;
  /** class id -> cloud user ids allowed to edit that class */
  classAssignments?: Record<string, string[]>;
  /** JHS (Basic 7–9): class id -> subject -> cloud user ids allowed to enter marks for that subject */
  subjectAssignments?: Record<string, Record<string, string[]>>;
  /** class id -> edited weekly timetable (missing = GES default) */
  timetables?: Record<string, import("./timetable").Timetable>;
}

export interface Student {
  id: string;
  name: string;
  admissionNo: string;
  classId: ClassId;
  attendance: string;
  /** subject name -> { sba, exam } */
  scores: Record<string, { sba: number | null; exam: number | null; sbaRaw?: number | null; examRaw?: number | null; test1?: number | null; test2?: number | null; project?: number | null; group?: number | null; level?: string | null }>;
  conduct: string;
  interest: string;
  remark: string;
  headRemark?: string;
  photo?: string;
  parentPhone?: string;
  promotion?: "promoted" | "retained" | "tbd";
  /** Optional fees box (GH₵). Total is computed on the report card. `items` holds extra school-defined fees (PTA, class fees, exam fees, …). */
  fees?: { arrears?: string; levies?: string; nextTerm?: string; items?: { label: string; amount: string }[] };
}

export interface AppData {
  school: School;
  students: Student[];
}

const STORAGE_KEY = "sba-report-cards-v1";

export const DEFAULT_SCHOOL: School = {
  name: "",
  address: "",
  term: "Term 1",
  academicYear: "2025/2026",
  reopeningDate: "",
  classTeacher: "",
  headTeacher: "",
  totalAttendance: "60",
  region: "",
  district: "",
  logo: "",
};

/**
 * Images never leave the device — the school cloud stores text records only.
 * Strip them before uploading; merge local copies back over remote data.
 */
export function stripSchoolImages(s: School): School {
  return { ...s, logo: "", signature: "", stamp: "", classTeacherSignatures: {} };
}

export function stripStudentImages(s: Student): Student {
  return s.photo ? { ...s, photo: "" } : s;
}

/** Remote school data carries no images — keep whatever is on this device. */
export function keepLocalSchoolImages(local: School, remote: School): School {
  const merged: School = { ...remote, logo: local.logo };
  if (local.signature) merged.signature = local.signature;
  if (local.stamp) merged.stamp = local.stamp;
  if (local.classTeacherSignatures) merged.classTeacherSignatures = local.classTeacherSignatures;
  return merged;
}

/** Remote student rows carry no photo — keep this device's copy. */
export function keepLocalStudentPhoto(local: Student | undefined, remote: Student): Student {
  return local?.photo ? { ...remote, photo: local.photo } : remote;
}

const initialData: AppData = { school: DEFAULT_SCHOOL, students: [] };

let data: AppData = initialData;
let hydrated = false;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function persist() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    /* storage unavailable */
  }
}

function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<AppData>;
      data = {
        school: { ...DEFAULT_SCHOOL, ...(parsed.school ?? {}) },
        students: parsed.students ?? [],
      };
    }
  } catch {
    /* ignore malformed data */
  }
  emit();
}

type ChangeListener = (prev: AppData, next: AppData) => void;
const changeListeners = new Set<ChangeListener>();

/** Subscribe to local (user-made) edits — used by the cloud sync engine. */
export function onLocalChange(cb: ChangeListener) {
  changeListeners.add(cb);
  return () => { changeListeners.delete(cb); };
}

export function getData() {
  hydrate();
  return data;
}

export function updateData(updater: (current: AppData) => AppData) {
  hydrate();
  const prev = data;
  data = updater(data);
  persist();
  emit();
  changeListeners.forEach((l) => l(prev, data));
}

/** Apply data coming from the cloud without echoing it back. */
export function applyRemote(updater: (current: AppData) => AppData) {
  hydrate();
  data = updater(data);
  persist();
  emit();
}

export function useAppData() {
  const [snapshot, setSnapshot] = useState<AppData>(data);

  useEffect(() => {
    hydrate();
    const listener = () => setSnapshot(data);
    listeners.add(listener);
    listener();
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const setSchool = useCallback((patch: Partial<School>) => {
    updateData((current) => ({ ...current, school: { ...current.school, ...patch } }));
  }, []);

  const addStudent = useCallback((name: string, classId: ClassId, admissionNo: string) => {
    updateData((current) => ({
      ...current,
      students: [
        ...current.students,
        {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          name,
          admissionNo,
          classId,
          attendance: "",
          scores: {},
          conduct: "",
          interest: "",
          remark: "",
        },
      ],
    }));
  }, []);

  const updateStudent = useCallback((id: string, patch: Partial<Student>) => {
    updateData((current) => ({
      ...current,
      students: current.students.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    }));
  }, []);

  const removeStudent = useCallback((id: string) => {
    updateData((current) => ({
      ...current,
      students: current.students.filter((s) => s.id !== id),
    }));
  }, []);

  const setScore = useCallback(
    (id: string, subject: string, field: "sba" | "exam", value: number | null) => {
      updateData((current) => ({
        ...current,
        students: current.students.map((s) =>
          s.id === id
            ? {
                ...s,
                scores: {
                  ...s.scores,
                  [subject]: {
                    sba: s.scores[subject]?.sba ?? null,
                    exam: s.scores[subject]?.exam ?? null,
                    [field]: value,
                  },
                },
              }
            : s,
        ),
      }));
    },
    [],
  );

  /** Teacher enters raw marks out of 100; SBA is scaled to 30% and exam to 70%. */
  const setRawScore = useCallback(
    (id: string, subject: string, field: "sba" | "exam", raw: number | null) => {
      const pct = field === "sba" ? 0.3 : 0.7;
      const scaled = raw === null ? null : Math.round(raw * pct * 10) / 10;
      updateData((current) => ({
        ...current,
        students: current.students.map((s) => {
          if (s.id !== id) return s;
          const prev = s.scores[subject] ?? { sba: null, exam: null };
          return {
            ...s,
            scores: { ...s.scores, [subject]: { ...prev, [field]: scaled, [`${field}Raw`]: raw } },
          };
        }),
      }));
    },
    [],
  );

  /** Basic 1–9: Test1/Test2/Project/Group raw → SBA 50%; exam raw /100 → 50%. */
  const setCatScore = useCallback(
    (id: string, subject: string, field: "test1" | "test2" | "project" | "group" | "examRaw", value: number | null) => {
      updateData((current) => ({
        ...current,
        students: current.students.map((s) => {
          if (s.id !== id) return s;
          const e = { ...(s.scores[subject] ?? { sba: null, exam: null }), [field]: value };
          const parts = [e.test1, e.test2, e.project, e.group];
          const any = parts.some((v) => v !== null && v !== undefined);
          const raw = parts.reduce<number>((a, v) => a + (v ?? 0), 0);
          e.sbaRaw = any ? raw : null;
          e.sba = any ? Math.round(raw * 0.5 * 10) / 10 : null;
          e.exam = e.examRaw === null || e.examRaw === undefined ? null : Math.round(e.examRaw * 0.5 * 10) / 10;
          return { ...s, scores: { ...s.scores, [subject]: e } };
        }),
      }));
    },
    [],
  );

  /** KG 1–2: teacher selects Gold / Silver / Bronze per learning area. Existing marks are kept untouched. */
  const setKgLevel = useCallback((id: string, subject: string, level: string | null) => {
    updateData((current) => ({
      ...current,
      students: current.students.map((s) => {
        if (s.id !== id) return s;
        const prev = s.scores[subject] ?? { sba: null, exam: null };
        return { ...s, scores: { ...s.scores, [subject]: { ...prev, level } } };
      }),
    }));
  }, []);

  const importStudents = useCallback((incoming: Student[]) => {
    updateData((current) => {
      const map = new Map(current.students.map((s) => [s.id, s]));
      incoming.forEach((s) => map.set(s.id, { ...map.get(s.id), ...s }));
      return { ...current, students: [...map.values()] };
    });
  }, []);

  return {
    importStudents,
    school: snapshot.school,
    students: snapshot.students,
    setSchool,
    addStudent,
    updateStudent,
    removeStudent,
    setScore,
    setRawScore,
    setCatScore,
    setKgLevel,
  };
}
