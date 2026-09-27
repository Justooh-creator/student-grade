import { useCallback, useEffect, useState } from "react";
import type { ClassId } from "./ges";

export interface School {
  name: string;
  address: string;
  term: string;
  academicYear: string;
  reopeningDate: string;
  classTeacher: string;
  headTeacher: string;
  totalAttendance: string;
  region: string;
  district: string;
  logo: string;
}

export interface Student {
  id: string;
  name: string;
  admissionNo: string;
  classId: ClassId;
  attendance: string;
  /** subject name -> { sba, exam } */
  scores: Record<string, { sba: number | null; exam: number | null; sbaRaw?: number | null; examRaw?: number | null }>;
  conduct: string;
  interest: string;
  remark: string;
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

export function updateData(updater: (current: AppData) => AppData) {
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
  };
}
