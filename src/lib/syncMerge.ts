/**
 * Field-level learner sync (Issue 2).
 *
 * Every local edit becomes a small "field operation": the path that changed (for example
 * scores › Mathematics › test1), the value the device last saw from the cloud (base) and the
 * new value. The server applies an operation only while the cloud still holds that base value,
 * so teachers editing different subjects or different boxes never overwrite each other.
 * When two teachers change the same box differently, the server keeps the cloud value and
 * records both versions as a conflict for review.
 *
 * `mergeStudentOps` mirrors the database function public.merge_student_ops exactly; it is
 * used for the local preview of pending edits and for the automated sync tests.
 */
import type { Student } from "./store";

export type Json = null | boolean | number | string | Json[] | { [k: string]: Json };
export interface FieldOp { p: string[]; b: Json; v: Json; seq: number }
export interface StudentChange {
  id: string;
  classId: string;
  name: string;
  /** Learner has never reached the cloud yet. */
  create?: boolean;
  /** Learner was removed on this device. */
  delete?: boolean;
  /** State just before a pending delete — used if the learner is restored before syncing. */
  before?: Student;
  ops: Record<string, FieldOp>;
  /** Latest text-only copy on this device (never contains a photo). */
  snapshot?: Student;
}
export interface SyncQueue { seq: number; students: Record<string, StudentChange> }
export interface WireChange { id: string; classId: string; create?: boolean; delete?: boolean; ops: { p: string[]; b: Json; v: Json }[]; snapshot?: Student }
export interface SyncConflict { p: string[]; base: Json; local: Json; cloud: Json }
export interface SyncResult { id: string; status: "ok" | "deleted" | "missing" | "rejected"; data?: Student; conflicts?: SyncConflict[]; invalid?: { p: string[]; reason: string }[] }

export const CAT_KEYS = ["test1", "test2", "project", "group", "examRaw"] as const;
const CAT_SET = new Set<string>(CAT_KEYS);
const CAT_MAX: Record<string, number> = { test1: 20, test2: 20, project: 30, group: 30, examRaw: 100 };
const DERIVED = new Set(["sba", "sbaRaw", "exam"]);
const SKIP_TOP = new Set(["id", "photo", "scores", "fees"]);

export const emptyQueue = (): SyncQueue => ({ seq: 0, students: {} });

/** Missing, null and "" all mean "empty". */
export function norm(v: unknown): Json {
  return v === undefined || v === null || v === "" ? null : (v as Json);
}

export function jsonEqual(a: unknown, b: unknown): boolean {
  const x = norm(a), y = norm(b);
  if (x === y) return true;
  if (typeof x === "number" && typeof y === "number") return x === y;
  if (x === null || y === null || typeof x !== "object" || typeof y !== "object") return false;
  if (Array.isArray(x) !== Array.isArray(y)) return false;
  if (Array.isArray(x)) { const ya = y as Json[]; return x.length === ya.length && x.every((v, i) => jsonEqual(v, ya[i])); }
  const xo = x as Record<string, Json>, yo = y as Record<string, Json>;
  const keys = new Set([...Object.keys(xo), ...Object.keys(yo)]);
  for (const k of keys) if (!jsonEqual(xo[k], yo[k])) return false;
  return true;
}

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const clone = <T>(v: T): T => (v === undefined ? v : JSON.parse(JSON.stringify(v)));

/** Field-level differences between two versions of one learner (photos never included). */
export function diffStudent(prev: Student | undefined, next: Student | undefined): { p: string[]; b: Json; v: Json }[] {
  const a = (prev ?? {}) as unknown as Record<string, unknown>;
  const z = (next ?? {}) as unknown as Record<string, unknown>;
  const out: { p: string[]; b: Json; v: Json }[] = [];
  for (const k of new Set([...Object.keys(a), ...Object.keys(z)])) {
    if (SKIP_TOP.has(k)) continue;
    if (!jsonEqual(a[k], z[k])) out.push({ p: [k], b: norm(clone(a[k])), v: norm(clone(z[k])) });
  }
  const fa = isObj(a.fees) ? a.fees : {}, fz = isObj(z.fees) ? z.fees : {};
  for (const k of new Set([...Object.keys(fa), ...Object.keys(fz)])) {
    if (!jsonEqual(fa[k], fz[k])) out.push({ p: ["fees", k], b: norm(clone(fa[k])), v: norm(clone(fz[k])) });
  }
  const sa = isObj(a.scores) ? a.scores : {}, sz = isObj(z.scores) ? z.scores : {};
  for (const subj of new Set([...Object.keys(sa), ...Object.keys(sz)])) {
    const ea = isObj(sa[subj]) ? (sa[subj] as Record<string, unknown>) : {};
    const ez = isObj(sz[subj]) ? (sz[subj] as Record<string, unknown>) : {};
    const cat = [...Object.keys(ea), ...Object.keys(ez)].some((k) => CAT_SET.has(k));
    for (const k of new Set([...Object.keys(ea), ...Object.keys(ez)])) {
      if (cat && DERIVED.has(k)) continue; // recalculated from the raw boxes on the server
      if (!jsonEqual(ea[k], ez[k])) out.push({ p: ["scores", subj, k], b: norm(ea[k]), v: norm(ez[k]) });
    }
  }
  return out;
}

const textOnly = (s: Student): Student => { const c = clone(s); delete (c as Partial<Student>).photo; return c; };
const opKey = (p: string[]) => p.join("\u241f");

/** Record a local edit in the queue, folding repeated edits of the same box into one operation. */
export function enqueue(queue: SyncQueue, prev: Student[], next: Student[]): SyncQueue {
  const q: SyncQueue = { seq: queue.seq, students: { ...queue.students } };
  const before = new Map(prev.map((s) => [s.id, s]));
  const after = new Map(next.map((s) => [s.id, s]));
  const fold = (ch: StudentChange, ops: { p: string[]; b: Json; v: Json }[]) => {
    for (const o of ops) {
      const key = opKey(o.p);
      const ex = ch.ops[key];
      if (ex) {
        if (jsonEqual(ex.b, o.v)) delete ch.ops[key];
        else ch.ops[key] = { ...ex, v: o.v, seq: ++q.seq };
      } else if (!(ch.create && o.v === null)) {
        ch.ops[key] = { p: o.p, b: ch.create ? null : o.b, v: o.v, seq: ++q.seq };
      }
    }
  };
  for (const [id, s] of after) {
    const old = before.get(id);
    if (old === s) continue;
    const existing = q.students[id];
    const ch: StudentChange = existing ? { ...existing, ops: { ...existing.ops } } : { id, classId: s.classId, name: s.name, ops: {}, create: !old };
    if (!old && ch.delete) {
      // Restored before the delete reached the cloud: compare against the state before deletion.
      ch.delete = false;
      fold(ch, diffStudent(ch.before, s));
      delete ch.before;
    } else {
      fold(ch, diffStudent(old, s));
    }
    ch.classId = s.classId; ch.name = s.name; ch.snapshot = textOnly(s);
    q.students[id] = ch;
  }
  for (const [id, old] of before) {
    if (after.has(id)) continue;
    const ch = q.students[id];
    if (ch?.create) { delete q.students[id]; continue; }
    q.students[id] = { ...(ch ?? { id, classId: old.classId, name: old.name, ops: {} }), delete: true, before: textOnly(old), ops: ch ? { ...ch.ops } : {} };
  }
  for (const [id, ch] of Object.entries(q.students)) {
    if (!ch.create && !ch.delete && Object.keys(ch.ops).length === 0) delete q.students[id];
  }
  return q;
}

export function toWire(queue: SyncQueue): WireChange[] {
  return Object.values(queue.students).map((c) => ({
    id: c.id, classId: c.classId,
    ...(c.create ? { create: true } : {}), ...(c.delete ? { delete: true } : {}),
    ops: c.delete ? [] : Object.values(c.ops).map(({ p, b, v }) => ({ p, b, v })),
    ...(c.snapshot ? { snapshot: c.snapshot } : {}),
  }));
}

/**
 * Remove only what the server confirmed. Edits made while the request was in flight stay
 * queued, re-based on the value the server now holds.
 */
export function acknowledge(queue: SyncQueue, sent: SyncQueue, results: SyncResult[]): SyncQueue {
  const q: SyncQueue = { seq: queue.seq, students: { ...queue.students } };
  const byId = new Map(results.map((r) => [r.id, r]));
  for (const s of Object.values(sent.students)) {
    const r = byId.get(s.id);
    if (!r) continue; // not processed — keep for retry
    const cur = q.students[s.id];
    if (!cur) continue;
    if (r.status === "missing" || r.status === "rejected") { delete q.students[s.id]; continue; }
    if (r.status === "deleted") {
      if (cur.delete) delete q.students[s.id];
      else q.students[s.id] = { ...cur, create: true, ops: Object.fromEntries(diffStudent(undefined, cur.snapshot).map((o) => [opKey(o.p), { ...o, b: null, seq: ++q.seq }])) };
      continue;
    }
    const conflicted = new Set((r.conflicts ?? []).map((c) => opKey(c.p)));
    const ops = { ...cur.ops };
    for (const [key, op] of Object.entries(s.ops)) {
      const now = ops[key];
      if (!now) continue;
      if (conflicted.has(key) || now.seq === op.seq) delete ops[key];
      else ops[key] = { ...now, b: op.v };
    }
    const next: StudentChange = { ...cur, ops };
    if (s.create) delete next.create;
    if (!next.create && !next.delete && Object.keys(ops).length === 0) delete q.students[s.id];
    else q.students[s.id] = next;
  }
  return q;
}

/** The app's setCatScore arithmetic for Basic 1–9 (kept identical to store.ts). */
export function recalcCat(entry: Record<string, unknown>): Record<string, unknown> {
  const e = { ...entry } as Record<string, number | null | undefined>;
  const parts = [e.test1, e.test2, e.project, e.group];
  const any = parts.some((v) => v !== null && v !== undefined);
  const raw = parts.reduce<number>((a, v) => a + (v ?? 0), 0);
  e.sbaRaw = any ? raw : null;
  e.sba = any ? Math.round(raw * 0.5 * 10) / 10 : null;
  e.exam = e.examRaw === null || e.examRaw === undefined ? null : Math.round(e.examRaw * 0.5 * 10) / 10;
  return e;
}

function setPath(target: Record<string, unknown>, p: string[], v: Json) {
  let node = target;
  for (let i = 0; i < p.length - 1; i++) {
    const k = p[i]!;
    node[k] = isObj(node[k]) ? { ...(node[k] as Record<string, unknown>) } : {};
    node = node[k] as Record<string, unknown>;
  }
  node[p[p.length - 1]!] = v;
}
const getPath = (t: unknown, p: string[]) => p.reduce<unknown>((n, k) => (isObj(n) ? n[k] : undefined), t);

function validOp(p: string[], v: Json): boolean {
  if (!p.length || p[0] === "id" || p[0] === "photo") return false;
  if (p[0] === "scores" ? p.length !== 3 : p[0] === "fees" ? p.length !== 2 : p.length !== 1) return false;
  if (p[0] === "scores" && CAT_SET.has(p[2]!) && v !== null) {
    return typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= CAT_MAX[p[2]!]!;
  }
  return true;
}

/** Mirror of public.merge_student_ops: apply ops whose base still matches; report the rest. */
export function mergeStudentOps(data: Student | Record<string, unknown> | undefined, ops: { p: string[]; b: Json; v: Json }[]) {
  const d = clone((data ?? {}) as Record<string, unknown>);
  const conflicts: SyncConflict[] = [];
  const invalid: { p: string[]; reason: string }[] = [];
  const recalc = new Set<string>();
  for (const op of ops) {
    const b = norm(op.b), v = norm(op.v);
    if (!validOp(op.p, v)) { invalid.push({ p: op.p, reason: "invalid" }); continue; }
    const cur = norm(getPath(d, op.p));
    if (jsonEqual(cur, v)) continue;
    if (jsonEqual(cur, b)) {
      setPath(d, op.p, op.v);
      if (op.p[0] === "scores" && CAT_SET.has(op.p[2]!)) recalc.add(op.p[1]!);
    } else conflicts.push({ p: op.p, base: b, local: v, cloud: cur });
  }
  const scores = d.scores as Record<string, Record<string, unknown>> | undefined;
  for (const s of recalc) if (scores) scores[s] = recalcCat(scores[s] ?? {});
  return { data: d as unknown as Student, conflicts, invalid };
}

/** Show this device's pending edits on top of the latest cloud copy (local preview only). */
export function rebase(remote: Student, change: StudentChange | undefined): Student {
  if (!change || change.delete) return remote;
  const d = clone(remote) as unknown as Record<string, unknown>;
  const recalc = new Set<string>();
  for (const op of Object.values(change.ops)) {
    setPath(d, op.p, op.v);
    if (op.p[0] === "scores" && CAT_SET.has(op.p[2]!)) recalc.add(op.p[1]!);
  }
  const scores = d.scores as Record<string, Record<string, unknown>> | undefined;
  for (const s of recalc) if (scores) scores[s] = recalcCat(scores[s] ?? {});
  return d as unknown as Student;
}

/** Set one field on a learner (used when a teacher chooses their own version of a conflict). */
export function withField(s: Student, p: string[], v: Json): Student {
  const d = clone(s) as unknown as Record<string, unknown>;
  setPath(d, p, v);
  if (p[0] === "scores" && CAT_SET.has(p[2]!)) {
    const scores = d.scores as Record<string, Record<string, unknown>>;
    scores[p[1]!] = recalcCat(scores[p[1]!] ?? {});
  }
  if (s.photo) (d as unknown as Student).photo = s.photo;
  return d as unknown as Student;
}

const FIELD_LABELS: Record<string, string> = {
  test1: "Class Test 1", test2: "Class Test 2", project: "Project Work", group: "Group Work", examRaw: "Exam",
  level: "Level", attendance: "Days present", conduct: "Conduct", interest: "Interest", remark: "Class teacher's remark",
  headRemark: "Headteacher's remark", name: "Name", admissionNo: "Admission number", gender: "Gender",
  classId: "Class", parentPhone: "Parent phone", promotion: "Promotion", arrears: "Arrears", levies: "Levies", nextTerm: "Next term fees", items: "Other fees",
};
export function fieldLabel(p: string[]): string {
  if (p[0] === "scores") return `${p[1]} · ${FIELD_LABELS[p[2]!] ?? p[2]}`;
  if (p[0] === "fees") return `Fees · ${FIELD_LABELS[p[1]!] ?? p[1]}`;
  return FIELD_LABELS[p[0]!] ?? p[0] ?? "";
}
