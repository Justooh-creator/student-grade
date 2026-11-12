import { describe, expect, it } from "vitest";
import { DEFAULT_SCHOOL, type School } from "./store";
import type { Json, SyncConflict } from "./syncMerge";
import {
  flushSchoolQueue, mergeSchoolOps, readSchoolQueue, rebaseSchool, recordSchoolChange, schoolQueueKey,
  type SchoolSyncResult, type SchoolTransport,
} from "./schoolSync";
import type { KeyValueStore } from "./syncQueue";

const SCHOOL = "school-1";
const memStore = (): KeyValueStore & { dump: () => Record<string, string> } => {
  const m = new Map<string, string>();
  return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => void m.set(k, v), removeItem: (k) => void m.delete(k), dump: () => Object.fromEntries(m) };
};
const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v));
const IMAGES = ["logo", "signature", "stamp", "classTeacherSignatures"];

/** In-memory stand-in for public.sync_school_changes (same merge function, same rules). */
class FakeServer {
  details: Record<string, unknown> = { name: "EduTech Academy", term: "Term 1", address: "Box 12, Ho" };
  conflicts: (SyncConflict & { by: string })[] = [];
  received: { p: string[]; b: Json; v: Json }[][] = [];
  down = false;
  loseNextReply = false;
  transport(user: string): SchoolTransport {
    return async (ops) => {
      if (this.down) throw new Error("Failed to fetch");
      this.received.push(clone(ops));
      const res = mergeSchoolOps(this.details, ops);
      for (const k of IMAGES) delete res.data[k]; // strip_school_images trigger
      this.details = res.data;
      res.conflicts.forEach((c) => this.conflicts.push({ ...c, by: user }));
      if (this.loseNextReply) { this.loseNextReply = false; throw new Error("Network lost"); }
      return clone({ data: res.data, name: String(res.data.name ?? ""), conflicts: res.conflicts, invalid: res.invalid }) as SchoolSyncResult;
    };
  }
}

/** One teacher's phone: School Details + persistent outbox (survives a refresh via the same store). */
class Device {
  key: string;
  school: School = { ...DEFAULT_SCHOOL };
  constructor(public user: string, public server: FakeServer, public store = memStore()) { this.key = schoolQueueKey(user, SCHOOL); }
  pull() { this.school = { ...DEFAULT_SCHOOL, ...(rebaseSchool(this.server.details, readSchoolQueue(this.key, this.store)) as Partial<School>), logo: this.school.logo }; }
  edit(patch: Partial<School>) { const prev = this.school; this.school = { ...prev, ...patch }; recordSchoolChange(this.key, prev, this.school, this.store); }
  async sync() {
    const r = await flushSchoolQueue(this.key, this.server.transport(this.user), this.store);
    if (r) this.school = { ...DEFAULT_SCHOOL, ...(rebaseSchool(r.data, readSchoolQueue(this.key, this.store)) as Partial<School>), logo: this.school.logo };
    return r;
  }
  pending() { return Object.keys(readSchoolQueue(this.key, this.store).ops).length; }
}
const setup = () => { const server = new FakeServer(); const a = new Device("A", server); a.pull(); const b = new Device("B", server); b.pull(); return { server, a, b }; };

describe("School Details outbox survives refreshes and offline periods", () => {
  it("keeps an offline edit after the app is reopened and sends it when back online", async () => {
    const { server, a } = setup();
    server.down = true;
    a.edit({ term: "Term 2" });
    await expect(a.sync()).rejects.toThrow();
    // Refresh: a fresh session on the same phone reloads the cloud copy (still Term 1).
    const reopened = new Device("A", server, a.store);
    reopened.pull();
    expect(reopened.school.term).toBe("Term 2");
    expect(reopened.pending()).toBe(1);
    server.down = false;
    await reopened.sync();
    expect(server.details.term).toBe("Term 2");
    expect(reopened.pending()).toBe(0);
  });

  it("keeps both teachers' edits to different fields made offline", async () => {
    const { server, a, b } = setup();
    a.edit({ reopeningDate: "2027-01-12" });
    b.edit({ headTeacher: "Mrs Agbeko" });
    await b.sync(); await a.sync();
    expect(server.details).toMatchObject({ reopeningDate: "2027-01-12", headTeacher: "Mrs Agbeko", term: "Term 1" });
    expect(server.conflicts).toHaveLength(0);
  });

  it("keeps different classes' teacher names set by two teachers", async () => {
    const { server, a, b } = setup();
    a.edit({ classTeachers: { b4: "Mr Mensah" } });
    b.edit({ classTeachers: { b5: "Ms Owusu" } });
    await a.sync(); await b.sync();
    expect(server.details.classTeachers).toEqual({ b4: "Mr Mensah", b5: "Ms Owusu" });
  });

  it("does not overwrite the same field changed by another teacher; records it for review", async () => {
    const { server, a, b } = setup();
    a.edit({ term: "Term 2" });
    b.edit({ term: "Term 3" });
    await a.sync(); await b.sync();
    expect(server.details.term).toBe("Term 2");
    expect(server.conflicts).toEqual([{ p: ["term"], base: "Term 1", local: "Term 3", cloud: "Term 2", by: "B" }]);
    expect(b.pending()).toBe(0);
    expect(b.school.term).toBe("Term 2");
  });

  it("never sends logos, signatures or stamps", async () => {
    const { server, a } = setup();
    a.edit({ logo: "data:image/png;base64,AAA", stamp: "data:x", signature: "data:y", classTeacherSignatures: { b4: "data:z" }, motto: "Knowledge is light" });
    await a.sync();
    expect(server.received.flat().map((o) => o.p[0])).toEqual(["motto"]);
    expect(a.school.logo).toBe("data:image/png;base64,AAA");
  });

  it("keeps an edit made while a send is in flight", async () => {
    const { server, a } = setup();
    a.edit({ district: "Ho Municipal" });
    const send = a.sync();
    a.edit({ district: "Ho West" });
    await send;
    expect(a.pending()).toBe(1);
    await a.sync();
    expect(server.details.district).toBe("Ho West");
    expect(a.pending()).toBe(0);
  });

  it("retries safely when the reply is lost after the cloud saved it", async () => {
    const { server, a } = setup();
    a.edit({ region: "Volta" });
    server.loseNextReply = true;
    await expect(a.sync()).rejects.toThrow();
    expect(a.pending()).toBe(1);
    await a.sync();
    expect(server.details.region).toBe("Volta");
    expect(server.conflicts).toHaveLength(0);
  });

  it("removes a class's access list when cleared instead of saving an empty value", async () => {
    const { server, a } = setup();
    a.edit({ classAssignments: { b4: ["u1"], b5: ["u2"] } });
    await a.sync();
    a.edit({ classAssignments: { b5: ["u2"] } });
    await a.sync();
    expect(server.details.classAssignments).toEqual({ b5: ["u2"] });
  });

  it("rejects streams other than 1, 2 or 3", () => {
    const r = mergeSchoolOps({}, [{ p: ["streams"], b: null, v: 5 }, { p: ["logo"], b: null, v: "x" }]);
    expect(r.invalid.map((x) => x.p[0])).toEqual(["streams", "logo"]);
    expect(r.data).toEqual({});
  });
});

describe("App merge matches the database merge (public.merge_school_ops)", () => {
  // Expected values were produced by running public.merge_school_ops on the same inputs.
  const cases: [Record<string, unknown>, { p: string[]; b: Json; v: Json }[], Record<string, unknown>][] = [
    [{ address: "x" }, [{ p: ["address"], b: "x", v: null }], {}],
    [{ address: "x" }, [{ p: ["address"], b: "x", v: "" }], { address: "" }],
    [{ classAssignments: { b4: ["u1"], b5: ["u2"] } }, [{ p: ["classAssignments", "b4"], b: ["u1"], v: null }], { classAssignments: { b5: ["u2"] } }],
    [{ classAssignments: ["bad"] }, [{ p: ["classAssignments", "0"], b: "bad", v: null }], { classAssignments: ["bad"] }],
    [{ subjectAssignments: { b7: "str" } }, [{ p: ["subjectAssignments", "b7", "Maths"], b: null, v: ["u"] }], { subjectAssignments: { b7: { Maths: ["u"] } } }],
  ];
  it.each(cases)("merges %j identically", (d, ops, expected) => {
    expect(mergeSchoolOps(d, ops).data).toEqual(expected);
  });
});
