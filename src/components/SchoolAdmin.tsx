import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { setCloud } from "@/lib/cloud";

interface Member { id: string; user_id: string; role: string; name: string; email: string }

export function SchoolAdmin({ schoolId, schoolName, joinCode, userId }: { schoolId: string; schoolName: string; joinCode: string; userId: string }) {
  const [members, setMembers] = useState<Member[]>([]);
  const [busy, setBusy] = useState(false);

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

  const msg = `Please join ${schoolName || "our school"} on EduReport to enter learners' marks.\n\n1. Open https://student-grade.lovable.app\n2. Sign in (or create an account)\n3. Tap ☰ → School Cloud\n4. Enter School Code: ${joinCode}`;

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
