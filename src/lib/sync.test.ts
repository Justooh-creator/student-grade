import { describe, expect, it } from "vitest";
import type { Student } from "./store";
import { mergeStudentOps, rebase, recalcCat, withField, type Json, type SyncConflict, type SyncResult, type WireChange } from "./syncMerge";
import { flushQueue, queueKey, readQueue, recordLocalChange, type KeyValueStore, type SyncTransport } from "./syncQueue";
import { withPendingEdits } from "./cloud";

const SCHOOL = "school-1";
const OTHER_SCHOOL = "school-2";

function memStore(): KeyValueStore & { dump: () => Record<string, string> } {
  const m = new Map<string, string>();
  return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => void m.set(k, v), removeItem: (k) => void m.delete(k), dump: () => Object.fromEntries(m) };
}
const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v));

/** In-memory stand-in for public.sync_student_changes (same merge function, same rules). */
class FakeServer {
  rows = new Map<string, { school: string; data: Student }>();
  members: Record<string, string> = { teacherA: SCHOOL, teacherB: SCHOOL, outsider: OTHER_SCHOOL };
  conflicts: (SyncConflict & { id: string; by: string; kind: string })[] = [];
  down = false;
  /** Commit the batch but lose the reply (connection drops mid-sync). */
  loseNextReply = false;

  transport(user: string, school: string): SyncTransport {
    return async (changes: WireChange[]) => {
      if (this.down) throw new Error("Failed to fetch");
      if (this.members[user] !== school) throw new Error("You are not a member of this school");
      const results: SyncResult[] = [];
      for (const ch of [...changes].sort((a, b) => a.id.localeCompare(b.id))) {
        const row = this.rows.get(ch.id);
        const mine = row && row.school === school ? row : undefined;
        if (ch.delete) { if (mine) this.rows.delete(ch.id); results.push({ id: ch.id, status: "deleted" }); continue; }
        let data: Student;
        if (!mine) {
          if (row) { results.push({ id: ch.id, status: "rejected" }); continue; }
          if (!ch.create) {
            this.conflicts.push({ id: ch.id, by: user, kind: "deleted", p: [], base: null, local: (ch.snapshot ?? null) as unknown as Json, cloud: null });
            results.push({ id: ch.id, status: "missing" });
            continue;
          }
          data = { id: ch.id } as Student;
        } else data = mine.data;
        const res = mergeStudentOps(data, ch.ops);
        const saved = { ...(res.data as Student), id: ch.id };
        delete saved.photo; // strip_student_images trigger
        this.rows.set(ch.id, { school, data: saved });
        res.conflicts.forEach((c) => this.conflicts.push({ ...c, id: ch.id, by: user, kind: "field" }));
        results.push({ id: ch.id, status: "ok", data: clone(saved), conflicts: res.conflicts, invalid: res.invalid });
      }
      if (this.loseNextReply) { this.loseNextReply = false; throw new Error("Network lost"); }
      return results;
    };
  }
  get(id: string) { return this.rows.get(id)?.data; }
}

/** One teacher's phone: local records + persistent outbox. */
class Device {
  key: string;
  constructor(public user: string, public server: FakeServer, public store = memStore(), public students: Student[] = [], public school = SCHOOL) {
    this.key = queueKey(user, school);
  }
  pull() { this.students = withPendingEdits(this.students, [...this.server.rows.values()].filter((r) => r.school === this.school).map((r) => clone(r.data)), readQueue(this.key, this.store)); }
  edit(update: (list: Student[]) => Student[]) {
    const prev = this.students;
    this.students = update(prev);
    recordLocalChange(this.key, prev, this.students, this.store);
  }
  mark(id: string, subject: string, field: string, v: number | null) {
    this.edit((list) => list.map((s) => (s.id === id ? withField(s, ["scores", subject, field], v) : s)));
  }
  async sync() {
    const results = await flushQueue(this.key, this.server.transport(this.user, this.school), this.store);
    if (results) {
      const q = readQueue(this.key, this.store);
      const byId = new Map(results.map((r) => [r.id, r]));
      this.students = this.students
        .filter((s) => byId.get(s.id)?.status !== "missing")
        .map((s) => { const r = byId.get(s.id); return r?.status === "ok" && r.data ? { ...rebase(r.data, q.students[s.id]), ...(s.photo ? { photo: s.photo } : {}) } : s; });
    }
    return results;
  }
  pending() { return Object.keys(readQueue(this.key, this.store).students).length; }
}

const learner = (over: Partial<Student> = {}): Student => ({
  id: "L1", name: "Ama Mensah", admissionNo: "001", classId: "b5", attendance: "", scores: {}, conduct: "", interest: "", remark: "", ...over,
});

function setup(initial: Student[] = [learner()]) {
  const server = new FakeServer();
  initial.forEach((s) => server.rows.set(s.id, { school: SCHOOL, data: clone(s) }));
  const a = new Device("teacherA", server); a.pull();
  const b = new Device("teacherB", server); b.pull();
  return { server, a, b };
}
const score = (s: Student | undefined, subj: string) => s?.scores[subj];

describe("Test A — different subjects edited offline by two teachers", () => {
  it("keeps Teacher A's Mathematics and Teacher B's English marks after both sync", async () => {
    const { server, a, b } = setup();
    server.down = true;
    a.mark("L1", "Mathematics", "test1", 15); a.mark("L1", "Mathematics", "test2", 18);
    b.mark("L1", "English Language", "test1", 17); b.mark("L1", "English Language", "test2", 19);
    await expect(a.sync()).rejects.toThrow();
    await expect(b.sync()).rejects.toThrow();
    server.down = false;
    await b.sync();
    await a.sync();
    const row = server.get("L1");
    expect(score(row, "Mathematics")).toMatchObject({ test1: 15, test2: 18, sbaRaw: 33, sba: 16.5 });
    expect(score(row, "English Language")).toMatchObject({ test1: 17, test2: 19, sbaRaw: 36, sba: 18 });
    expect(server.conflicts).toHaveLength(0);
    b.pull();
    expect(score(b.students[0], "Mathematics")?.test1).toBe(15);
  });
});

describe("Test B — different components", () => {
  it("keeps Mathematics Test 1 from A and Project Work from B", async () => {
    const { server, a, b } = setup();
    a.mark("L1", "Mathematics", "test1", 15);
    b.mark("L1", "Mathematics", "project", 25);
    await a.sync(); await b.sync();
    expect(score(server.get("L1"), "Mathematics")).toMatchObject({ test1: 15, project: 25, sbaRaw: 40, sba: 20 });
  });
});

describe("Test C — same subject, different components including the exam", () => {
  it("keeps every component and recalculates SBA and exam once", async () => {
    const { server, a, b } = setup([learner({ scores: { Science: { sba: 5, exam: null, sbaRaw: 10, test1: 10 } } })]);
    a.mark("L1", "Science", "test2", 12); a.mark("L1", "Science", "examRaw", 71);
    b.mark("L1", "Science", "group", 24);
    await b.sync(); await a.sync();
    expect(score(server.get("L1"), "Science")).toMatchObject({ test1: 10, test2: 12, group: 24, examRaw: 71, sbaRaw: 46, sba: 23, exam: 35.5 });
  });
});

describe("Test D — same box changed differently", () => {
  it("detects the conflict, never overwrites silently, keeps both versions and resolves", async () => {
    const { server, a, b } = setup();
    a.mark("L1", "Mathematics", "test1", 12);
    b.mark("L1", "Mathematics", "test1", 16);
    await a.sync();
    const results = await b.sync();
    expect(results?.[0]?.conflicts).toEqual([{ p: ["scores", "Mathematics", "test1"], base: null, local: 16, cloud: 12 }]);
    expect(score(server.get("L1"), "Mathematics")?.test1).toBe(12); // not overwritten
    expect(server.conflicts).toMatchObject([{ id: "L1", by: "teacherB", local: 16, cloud: 12 }]); // both kept
    expect(b.pending()).toBe(0);
    expect(score(b.students[0], "Mathematics")?.test1).toBe(12);
    // Teacher B reviews and chooses their entry: it goes through the normal checked sync.
    b.mark("L1", "Mathematics", "test1", 16);
    const again = await b.sync();
    expect(again?.[0]?.conflicts).toEqual([]);
    expect(score(server.get("L1"), "Mathematics")).toMatchObject({ test1: 16, sba: 8 });
  });
});

describe("Test E — repeated synchronisation", () => {
  it("is safe to resend after a lost reply and creates no duplicates", async () => {
    const { server, a } = setup([]);
    a.edit((l) => [...l, learner({ id: "NEW1", name: "Kofi" })]);
    a.mark("NEW1", "Mathematics", "test1", 14);
    server.loseNextReply = true;
    await expect(a.sync()).rejects.toThrow();
    expect(a.pending()).toBe(1); // nothing cleared without confirmation
    await a.sync();
    await a.sync();
    expect(await a.sync()).toBeNull();
    expect(server.rows.size).toBe(1);
    expect(server.conflicts).toHaveLength(0);
    expect(server.get("NEW1")).toMatchObject({ name: "Kofi", scores: { Mathematics: { test1: 14, sba: 7 } } });
  });
});

describe("Test F — offline restart", () => {
  it("keeps pending marks after the app is closed and reopened, and shows them over the cloud copy", async () => {
    const { server, a } = setup();
    server.down = true;
    a.mark("L1", "Mathematics", "test1", 19);
    const reopened = new Device("teacherA", server, a.store, []);
    reopened.pull(); // cloud still has the old copy
    expect(reopened.pending()).toBe(1);
    expect(score(reopened.students[0], "Mathematics")?.test1).toBe(19);
    server.down = false;
    await reopened.sync();
    expect(score(server.get("L1"), "Mathematics")?.test1).toBe(19);
    expect(reopened.pending()).toBe(0);
  });
});

describe("Test G — internet interruption", () => {
  it("leaves the outbox untouched on failure and recovers after reconnecting", async () => {
    const { server, a } = setup();
    a.mark("L1", "Mathematics", "test1", 11);
    const before = JSON.stringify(readQueue(a.key, a.store));
    server.down = true;
    await expect(a.sync()).rejects.toThrow();
    expect(JSON.stringify(readQueue(a.key, a.store))).toBe(before);
    server.down = false;
    await a.sync();
    expect(a.pending()).toBe(0);
    expect(score(server.get("L1"), "Mathematics")?.test1).toBe(11);
  });

  it("keeps edits made while a sync is in flight, re-based on the saved value", async () => {
    const { server, a } = setup();
    a.mark("L1", "Mathematics", "test1", 10);
    const t = server.transport("teacherA", SCHOOL);
    let release!: () => void;
    const gate = new Promise<void>((r) => (release = r));
    const slow: SyncTransport = async (c) => { await gate; return t(c); };
    const job = flushQueue(a.key, slow, a.store);
    a.mark("L1", "Mathematics", "test1", 13);
    release();
    await job;
    expect(a.pending()).toBe(1);
    await a.sync();
    expect(score(server.get("L1"), "Mathematics")?.test1).toBe(13);
    expect(server.conflicts).toHaveLength(0);
  });
});

describe("Test H — school isolation", () => {
  it("rejects syncing into a school the teacher does not belong to and keeps the outbox", async () => {
    const server = new FakeServer();
    server.rows.set("L1", { school: SCHOOL, data: learner() });
    const intruder = new Device("outsider", server, memStore(), [learner()], SCHOOL);
    intruder.mark("L1", "Mathematics", "test1", 1);
    await expect(intruder.sync()).rejects.toThrow(/not a member/);
    expect(score(server.get("L1"), "Mathematics")).toBeUndefined();
  });

  it("refuses to take over a learner id that belongs to another school", async () => {
    const server = new FakeServer();
    server.rows.set("X1", { school: SCHOOL, data: learner({ id: "X1" }) });
    const other = new Device("outsider", server, memStore(), [], OTHER_SCHOOL);
    other.edit(() => [learner({ id: "X1", name: "Fake" })]);
    const res = await other.sync();
    expect(res?.[0]?.status).toBe("rejected");
    expect(server.get("X1")?.name).toBe("Ama Mensah");
  });
});

describe("Test I — privacy", () => {
  it("never sends learner photos to the cloud", async () => {
    const { server, a } = setup();
    a.edit((l) => l.map((s) => ({ ...s, photo: "data:image/png;base64,AAAA", remark: "Good" })));
    a.edit((l) => [...l, learner({ id: "P2", photo: "data:image/png;base64,BBBB" })]);
    let sent = "";
    const t = server.transport("teacherA", SCHOOL);
    await flushQueue(a.key, async (c) => { sent = JSON.stringify(c); return t(c); }, a.store);
    expect(sent).not.toContain("base64");
    expect(JSON.stringify(a.store.dump())).not.toContain("base64");
    expect(server.get("L1")?.photo).toBeUndefined();
    expect(server.get("L1")?.remark).toBe("Good");
  });
});

describe("Test J — existing records", () => {
  it("keeps previously saved details and marks when another field syncs", async () => {
    const existing = learner({ remark: "Hardworking", conduct: "Respectful", attendance: "58", parentPhone: "0241234567",
      scores: { Mathematics: { sba: 16.5, exam: 40, sbaRaw: 33, examRaw: 80, test1: 15, test2: 18 }, "English Language": { sba: 18, exam: 35, sbaRaw: 36, examRaw: 70, test1: 17, test2: 19 } } });
    const { server, a } = setup([existing]);
    a.mark("L1", "Science", "test1", 9);
    await a.sync();
    const row = server.get("L1")!;
    expect(row).toMatchObject({ remark: "Hardworking", conduct: "Respectful", attendance: "58", parentPhone: "0241234567" });
    expect(row.scores["Mathematics"]).toEqual(existing.scores["Mathematics"]);
    expect(row.scores["English Language"]).toEqual(existing.scores["English Language"]);
    expect(row.scores["Science"]).toMatchObject({ test1: 9, sba: 4.5 });
  });

  it("keeps an offline teacher's copy for review when another teacher removed the learner", async () => {
    const { server, a } = setup();
    a.mark("L1", "Mathematics", "test1", 15);
    server.rows.delete("L1");
    const res = await a.sync();
    expect(res?.[0]?.status).toBe("missing");
    expect(server.conflicts[0]).toMatchObject({ id: "L1", kind: "deleted" });
    expect((server.conflicts[0]!.local as unknown as Student).scores["Mathematics"]?.test1).toBe(15);
  });
});

describe("merge rules", () => {
  it("refuses out-of-range marks on the server side", () => {
    const r = mergeStudentOps(learner(), [{ p: ["scores", "Mathematics", "test1"], b: null, v: 25 }]);
    expect(r.invalid).toHaveLength(1);
    expect(r.data.scores["Mathematics"]).toBeUndefined();
  });
  it("uses the same SBA/exam arithmetic as score entry", () => {
    expect(recalcCat({ test1: 15.5, test2: 17, project: 26, group: 28.5, examRaw: 77 })).toMatchObject({ sbaRaw: 87, sba: 43.5, exam: 38.5 });
    expect(recalcCat({ examRaw: 45.5 })).toMatchObject({ sbaRaw: null, sba: null, exam: 22.8 });
  });
});
