import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { setCloud } from "@/lib/cloud";
import { useAppData } from "@/lib/store";
import { CLASS_LEVELS, STREAM_LETTERS, classStream, getClassLevel, isJhs, schoolClassIds } from "@/lib/ges";

interface Member { id: string; user_id: string; role: string; name: string; email: string }

export function SchoolAdmin({ schoolId, schoolName, joinCode, userId }: { schoolId: string; schoolName: string; joinCode: string; userId: string }) {
  const [members, setMembers] = useState<Member[]>([]);
  const [busy, setBusy] = useState(false);
  const { school, setSchool } = useAppData();
  const streamCount = school.streams ?? 1;
  const [streamFilter, setStreamFilter] = useState<string>("all");
  const visibleClassIds = schoolClassIds(school).filter((id) => streamFilter === "all" || classStream(id) === streamFilter);
  const streamTabs = streamCount > 1 ? (
    <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Filter by stream">
      {["all", ...STREAM_LETTERS.slice(0, streamCount)].map((s) => (
        <button key={s} type="button" onClick={() => setStreamFilter(s)} aria-pressed={streamFilter === s}
          className={`rounded-full border px-3 py-1 text-xs font-bold ${streamFilter === s ? "border-primary bg-primary text-primary-foreground" : "border-input"}`}>
          {s === "all" ? "All streams" : `Stream ${s.toUpperCase()}`}
        </button>
      ))}
    </div>
  ) : null;

  const load = useCallback(async () => {
    const { data: ms } = await supabase.from("school_members").select("id, user_id, role").eq("school_id", schoolId);
    const ids = (ms ?? []).map((m) => m.user_id);
    const { data: ps } = ids.length ? await supabase.from("profiles").select("id, display_name, email").in("id", ids) : { data: [] };
    setMembers((ms ?? []).map((m) => {
      const p = ps?.find((x) => x.id === m.user_id);
      return { ...m, name: p?.display_name || "Teacher", email: p?.email || "" };
    }).sort((a, b) => (a.role === b.role ? a.name.localeCompare(b.name) : a.role === "headteacher" ? -1 : 1)));
  }, [schoolId]);

  useEffect(() => {
    load();
    const ch = supabase.channel(`members-${schoolId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "school_members", filter: `school_id=eq.${schoolId}` }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [load, schoolId]);

  const msg = `Please join ${schoolName || "our school"} on EduReport to enter learners' marks.\n\n1. Open https://www.edureportghana.com\n2. Sign in (or create an account)\n3. Tap ☰ → School Cloud\n4. Enter School Code: ${joinCode}`;

  async function run(fn: () => PromiseLike<{ error: { message: string } | null }>, ok: string) {
    setBusy(true);
    const { error } = await fn();
    if (error) toast.error(error.message); else { toast.success(ok); await load(); }
    setBusy(false);
  }
  async function regenerate() {
    if (!confirm("Make a new School Code? The old code will stop working for new teachers.")) return;
    setBusy(true);
    const { data, error } = await supabase.rpc("regenerate_join_code", { _school: schoolId });
    if (error) toast.error(error.message); else { setCloud({ joinCode: data as string }); toast.success("New School Code created."); }
    setBusy(false);
  }

  const card = "rounded-lg border border-border bg-card p-5";
  const small = "rounded-md border border-input px-3 py-1.5 text-xs font-bold disabled:opacity-50";

  return (
    <>
      <div className={card}>
        <p className="font-bold">School registration details</p>
        <label className="mt-3 block">
          <span className="text-[13px] font-bold uppercase tracking-[0.14em] text-foreground">EMIS code</span>
          <input value={school.emisCode ?? ""} onChange={(e) => setSchool({ emisCode: e.target.value })} placeholder="School EMIS code"
            className="mt-1 h-10 w-full rounded-md border border-border bg-card px-3 text-sm outline-none focus:border-primary" />
        </label>
      </div>
      <div className={card}>
        <p className="font-bold">Class teachers</p>
        <p className="mt-1 text-sm text-muted-foreground">Pick a teacher for each class. The name shows on Student Details and report cards.</p>
        {streamTabs}
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {visibleClassIds.map(getClassLevel).map((c) => {
            const cur = school.classTeachers?.[c.id] ?? "";
            const names = members.map((m) => m.name);
            return (
              <label key={c.id} className="flex items-center gap-2">
                <span className="w-16 shrink-0 text-sm font-bold">{c.name}</span>
                <select value={cur} onChange={(e) => setSchool({ classTeachers: { ...(school.classTeachers ?? {}), [c.id]: e.target.value } })}
                  className="h-9 min-w-0 flex-1 rounded-md border border-border bg-card px-2 text-sm">
                  <option value="">Not assigned</option>
                  {cur && !names.includes(cur) && <option value={cur}>{cur}</option>}
                  {names.map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </label>
            );
          })}
        </div>
      </div>
      <div className={card}>
        <p className="font-bold">Who can edit each class</p>
        <p className="mt-1 text-sm text-muted-foreground">Tick the teachers allowed to enter marks. Other teachers can only view. A class with nobody ticked stays open to all. Headteachers can edit every class. Basic 7–9 are assigned by subject — each subject teacher enters marks for their own subject only.</p>
        <div className="mt-3 space-y-3">
          {visibleClassIds.map(getClassLevel).map((c) => {
            const list = school.classAssignments?.[c.id] ?? [];
            const teachers = members.filter((m) => m.role !== "headteacher");
            const jhs = isJhs(c.id);
            const subMap = school.subjectAssignments?.[c.id] ?? {};
            const anySubject = Object.values(subMap).some((l) => l.length > 0);
            return (
              <div key={c.id} className="rounded-md border border-border p-2">
                <p className="text-sm font-bold">{c.name}{!jhs && list.length === 0 && <span className="ml-2 text-xs font-normal text-muted-foreground">(open to all)</span>}{jhs && !anySubject && <span className="ml-2 text-xs font-normal text-muted-foreground">(open to all)</span>}</p>
                {teachers.length === 0 ? <p className="text-xs text-muted-foreground">No teachers have joined yet.</p> : jhs ? (
                  <div className="mt-2 space-y-2">
                    {c.subjects.map((sub) => {
                      const subList = subMap[sub] ?? [];
                      return (
                        <div key={sub} className="flex flex-wrap items-center gap-x-4 gap-y-1">
                          <span className="w-40 shrink-0 text-xs font-bold">{sub}</span>
                          {teachers.map((m) => (
                            <label key={m.user_id} className="flex items-center gap-1.5 text-sm">
                              <input type="checkbox" checked={subList.includes(m.user_id)}
                                onChange={(e) => {
                                  const next = e.target.checked ? [...subList, m.user_id] : subList.filter((x) => x !== m.user_id);
                                  setSchool({ subjectAssignments: { ...(school.subjectAssignments ?? {}), [c.id]: { ...subMap, [sub]: next } } });
                                }} />
                              {m.name}
                            </label>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
                    {teachers.map((m) => (
                      <label key={m.user_id} className="flex items-center gap-1.5 text-sm">
                        <input type="checkbox" checked={list.includes(m.user_id)}
                          onChange={(e) => {
                            const next = e.target.checked ? [...list, m.user_id] : list.filter((x) => x !== m.user_id);
                            setSchool({ classAssignments: { ...(school.classAssignments ?? {}), [c.id]: next } });
                          }} />
                        {m.name}
                      </label>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      <div className={card}>
        <p className="font-bold">Invite teachers</p>
        <p className="mt-1 text-sm text-muted-foreground">Send the School Code so teachers can join.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <a className="rounded-md bg-primary px-4 py-2 text-sm font-bold text-primary-foreground" target="_blank" rel="noreferrer"
            href={`https://wa.me/?text=${encodeURIComponent(msg)}`}>Invite by WhatsApp</a>
          <a className="rounded-md border border-input px-4 py-2 text-sm font-bold"
            href={`mailto:?subject=${encodeURIComponent(`Join ${schoolName} on EduReport`)}&body=${encodeURIComponent(msg)}`}>Invite by email</a>
          <button className="rounded-md border border-input px-4 py-2 text-sm font-bold" disabled={busy} onClick={regenerate}>New School Code</button>
        </div>
      </div>
      <div className={card}>
        <p className="font-bold">Teachers ({members.length})</p>
        <ul className="mt-3 divide-y divide-border">
          {members.map((m) => (
            <li key={m.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
              <div>
                <p className="text-sm font-bold">{m.name}{m.user_id === userId && " (you)"}</p>
                <p className="text-xs text-muted-foreground">{m.email} · <b>{m.role === "headteacher" ? "Headteacher" : "Teacher"}</b></p>
              </div>
              <div className="flex gap-2">
                <button className={small} disabled={busy}
                  onClick={() => run(() => supabase.rpc("set_member_role", { _member: m.id, _role: m.role === "headteacher" ? "teacher" : "headteacher" }), "Role changed.")}>
                  {m.role === "headteacher" ? "Make teacher" : "Make headteacher"}
                </button>
                {m.user_id !== userId && (
                  <button className={`${small} border-destructive text-destructive`} disabled={busy}
                    onClick={() => confirm(`Remove ${m.name} from the school?`) && run(() => supabase.rpc("remove_member", { _member: m.id }), "Access removed.")}>
                    Remove
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
