/**
 * Field-level School Details sync.
 *
 * Each School Details edit is stored on this device as a small field operation (for example
 * "term" or "classTeachers › b4") with the value the device last saw from the cloud (base) and
 * the new value. The queue lives in localStorage per teacher and school, so unsent edits survive
 * refreshes, restarts and no-internet periods. The server applies an operation only while the
 * cloud still holds its base value; a different value written by someone else is kept and the
 * clash is recorded for review instead of being overwritten.
 *
 * `mergeSchoolOps` mirrors the database function public.merge_school_ops exactly.
 * A null value means "remove this field" so defaults apply again after reload.
 */
import type { School } from "./store";
import { jsonEqual, norm, type Json, type SyncConflict } from "./syncMerge";
import { defaultStore, type KeyValueStore } from "./syncQueue";

export interface SchoolOp { p: string[]; b: Json; v: Json; seq: number }
export interface SchoolQueue { seq: number; ops: Record<string, SchoolOp> }
export interface SchoolSyncResult { data: Record<string, unknown>; name: string; conflicts: SyncConflict[]; invalid: { p: string[]; reason: string }[] }
export type SchoolTransport = (ops: { p: string[]; b: Json; v: Json }[]) => Promise<SchoolSyncResult>;

/** Device-only images: never sent to the cloud. */
export const SCHOOL_IMAGE_KEYS = new Set(["logo", "signature", "stamp", "classTeacherSignatures"]);
/** Per-class maps are synced one class at a time; subject access one subject at a time. */
const MAP2 = new Set(["classTeachers", "classAssignments", "timetables"]);
const MAP3 = "subjectAssignments";
const BAD_KEYS = new Set(["", "__proto__", "constructor", "prototype"]);

export const emptySchoolQueue = (): SchoolQueue => ({ seq: 0, ops: {} });
const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const clone = <T>(v: T): T => (v === undefined ? v : JSON.parse(JSON.stringify(v)));
const raw = (v: unknown): Json => (v === undefined ? null : (clone(v) as Json));
const opKey = (p: string[]) => p.join("\u241f");

/** Field-level differences between two versions of School Details (images excluded). */
export function diffSchool(prev: Partial<School> | undefined, next: Partial<School> | undefined): { p: string[]; b: Json; v: Json }[] {
  const a = (prev ?? {}) as Record<string, unknown>, z = (next ?? {}) as Record<string, unknown>;
  const out: { p: string[]; b: Json; v: Json }[] = [];
  const push = (p: string[], x: unknown, y: unknown) => { if (!jsonEqual(x, y)) out.push({ p, b: norm(raw(x)), v: raw(y) }); };
  for (const k of new Set([...Object.keys(a), ...Object.keys(z)])) {
    if (SCHOOL_IMAGE_KEYS.has(k) || BAD_KEYS.has(k)) continue;
    if (MAP2.has(k) || k === MAP3) {
      const ma = isObj(a[k]) ? a[k] : {}, mz = isObj(z[k]) ? z[k] : {};
      for (const c of new Set([...Object.keys(ma), ...Object.keys(mz)])) {
        if (BAD_KEYS.has(c)) continue;
        if (k !== MAP3) { push([k, c], ma[c], mz[c]); continue; }
        const sa = isObj(ma[c]) ? ma[c] : {}, sz = isObj(mz[c]) ? mz[c] : {};
        for (const s of new Set([...Object.keys(sa), ...Object.keys(sz)])) if (!BAD_KEYS.has(s)) push([k, c, s], sa[s], sz[s]);
      }
      continue;
    }
    push([k], a[k], z[k]);
  }
  return out;
}

/** Record a School Details edit, folding repeated edits of the same field into one operation. */
export function enqueueSchool(queue: SchoolQueue, prev: Partial<School>, next: Partial<School>): SchoolQueue {
  const q: SchoolQueue = { seq: queue.seq, ops: { ...queue.ops } };
  for (const o of diffSchool(prev, next)) {
    const key = opKey(o.p);
    const ex = q.ops[key];
    if (ex) {
      if (jsonEqual(ex.b, o.v)) delete q.ops[key];
      else q.ops[key] = { ...ex, v: o.v, seq: ++q.seq };
    } else q.ops[key] = { p: o.p, b: o.b, v: o.v, seq: ++q.seq };
  }
  return q;
}

export const schoolToWire = (q: SchoolQueue) => Object.values(q.ops).sort((x, y) => x.seq - y.seq).map(({ p, b, v }) => ({ p, b, v }));

/** Remove only confirmed operations; edits made while the request was in flight stay queued. */
export function acknowledgeSchool(queue: SchoolQueue, sent: SchoolQueue, result: SchoolSyncResult): SchoolQueue {
  const q: SchoolQueue = { seq: queue.seq, ops: { ...queue.ops } };
  const done = new Set([...(result.conflicts ?? []), ...(result.invalid ?? [])].map((c) => opKey(c.p)));
  for (const [key, op] of Object.entries(sent.ops)) {
    const now = q.ops[key];
    if (!now) continue;
    if (done.has(key) || now.seq === op.seq) delete q.ops[key];
    else q.ops[key] = { ...now, b: norm(op.v) };
  }
  return q;
}

function validSchoolOp(p: unknown, v: Json): "path" | "range" | null {
  if (!Array.isArray(p) || !p.length || p.some((x) => typeof x !== "string" || BAD_KEYS.has(x) || x.length > 80)) return "path";
  const [k] = p as string[];
  if (SCHOOL_IMAGE_KEYS.has(k!)) return "path";
  if (MAP2.has(k!) ? p.length !== 2 : k === MAP3 ? p.length !== 3 : p.length !== 1) return "path";
  if (k === "streams" && v !== null && !(typeof v === "number" && [1, 2, 3].includes(v))) return "range";
  return null;
}

const getPath = (t: unknown, p: string[]) => p.reduce<unknown>((n, k) => (isObj(n) ? n[k] : undefined), t);
function writePath(target: Record<string, unknown>, p: string[], v: Json) {
  let node = target;
  for (let i = 0; i < p.length - 1; i++) {
    const k = p[i]!;
    if (v === null && !isObj(node[k])) return; // nothing to remove
    node[k] = isObj(node[k]) ? { ...(node[k] as Record<string, unknown>) } : {};
    node = node[k] as Record<string, unknown>;
  }
  if (v === null) delete node[p[p.length - 1]!];
  else node[p[p.length - 1]!] = v;
}

/** Mirror of public.merge_school_ops: apply ops whose base still matches; report the rest. */
export function mergeSchoolOps(details: Record<string, unknown> | undefined, ops: { p: string[]; b: Json; v: Json }[]) {
  const d = clone(isObj(details) ? details : {}) as Record<string, unknown>;
  const conflicts: SyncConflict[] = [];
  const invalid: { p: string[]; reason: string }[] = [];
  for (const op of ops) {
    const b = norm(op.b), v = norm(op.v);
    const bad = validSchoolOp(op.p, v);
    if (bad) { invalid.push({ p: op.p, reason: bad }); continue; }
    const cur = norm(getPath(d, op.p));
    if (jsonEqual(cur, v)) continue;
    if (jsonEqual(cur, b)) writePath(d, op.p, op.v === undefined ? null : op.v);
    else conflicts.push({ p: op.p, base: b, local: v, cloud: cur });
  }
  return { data: d, conflicts, invalid };
}

/** Show this device's unsent School Details edits on top of the latest cloud copy. */
export function rebaseSchool(details: Record<string, unknown> | undefined, q: SchoolQueue | undefined): Record<string, unknown> {
  const d = clone(isObj(details) ? details : {}) as Record<string, unknown>;
  if (!q) return d;
  for (const op of Object.values(q.ops).sort((x, y) => x.seq - y.seq)) writePath(d, op.p, op.v);
  return d;
}

/** Set one School Details field (used when a teacher keeps their own version of a clash). */
export function withSchoolField(s: School, p: string[], v: Json): School {
  const d = clone(s) as unknown as Record<string, unknown>;
  writePath(d, p, v);
  for (const k of SCHOOL_IMAGE_KEYS) if ((s as unknown as Record<string, unknown>)[k] !== undefined) d[k] = (s as unknown as Record<string, unknown>)[k];
  return d as unknown as School;
}

const LABELS: Record<string, string> = {
  name: "School name", address: "Address", contactPhone: "Contact phone", term: "Term", academicYear: "Academic year",
  reopeningDate: "Reopening date", vacationDate: "Vacation date", classTeacher: "Class teacher", headTeacher: "Headteacher",
  totalAttendance: "Total attendance", region: "Region", district: "District", motto: "Motto", emisCode: "EMIS code",
  streams: "Class streams", classTeachers: "Class teacher", classAssignments: "Class access", subjectAssignments: "Subject access", timetables: "Timetable",
};
export function schoolFieldLabel(p: string[]): string {
  return ["School Details", LABELS[p[0]!] ?? p[0], ...p.slice(1).map((x) => x.toUpperCase())].join(" · ");
}

// ---------- Persistent outbox ----------

export const schoolQueueKey = (userId: string, schoolId: string) => `edureport-school-queue-v1:${userId}:${schoolId}`;

export function readSchoolQueue(key: string, store: KeyValueStore = defaultStore()): SchoolQueue {
  try {
    const q = JSON.parse(store.getItem(key) || "null") as SchoolQueue | null;
    return q && typeof q.seq === "number" && isObj(q.ops) ? q : emptySchoolQueue();
  } catch { return emptySchoolQueue(); }
}
export function writeSchoolQueue(key: string, q: SchoolQueue, store: KeyValueStore = defaultStore()) {
  if (!Object.keys(q.ops).length) store.removeItem(key);
  else store.setItem(key, JSON.stringify(q));
}
export function recordSchoolChange(key: string, prev: Partial<School>, next: Partial<School>, store: KeyValueStore = defaultStore()) {
  const q = enqueueSchool(readSchoolQueue(key, store), prev, next);
  writeSchoolQueue(key, q, store);
  return q;
}
export const schoolPendingCount = (q: SchoolQueue) => Object.keys(q.ops).length;

const inFlight = new Map<string, Promise<SchoolSyncResult | null>>();
/** Send pending School Details edits once; throws on failure and leaves the queue untouched. */
export function flushSchoolQueue(key: string, transport: SchoolTransport, store: KeyValueStore = defaultStore()): Promise<SchoolSyncResult | null> {
  const running = inFlight.get(key);
  if (running) return running.then(() => flushSchoolQueue(key, transport, store), () => flushSchoolQueue(key, transport, store));
  const job = (async () => {
    const sent = readSchoolQueue(key, store);
    if (!schoolPendingCount(sent)) return null;
    const result = await transport(schoolToWire(sent));
    writeSchoolQueue(key, acknowledgeSchool(readSchoolQueue(key, store), sent, result), store);
    return result;
  })();
  inFlight.set(key, job);
  const clear = () => { if (inFlight.get(key) === job) inFlight.delete(key); };
  job.then(clear, clear);
  return job;
}
