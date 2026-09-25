import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/lib/auth";
import type { Student } from "@/lib/store";

export function CloudShare({ classId, className, students }: { classId: string; className: string; students: Student[] }) {
  const { user, ready } = useUser();
  const [teachers, setTeachers] = useState<{ id: string; display_name: string; email: string }[]>([]);
  const [to, setTo] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("id, display_name, email").neq("id", user.id).order("display_name")
      .then(({ data }) => setTeachers(data ?? []));
  }, [user]);

  if (!ready) return null;
  if (!user) {
    return (
      <Link to="/auth" className="block rounded-md border border-dashed border-border px-2 py-2 text-center text-xs font-semibold text-primary hover:bg-muted">
        Sign in to send records to a teacher
      </Link>
    );
  }

  async function send() {
    if (!to || !user) return;
    setBusy(true);
    const me = await supabase.from("profiles").select("display_name").eq("id", user.id).maybeSingle();
    const { error } = await supabase.from("record_shares").upsert(
      {
        sender_id: user.id,
        recipient_id: to,
        class_id: classId,
        sender_name: me.data?.display_name || user.email || "",
        payload: students as never,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "sender_id,recipient_id,class_id" },
    );
    setBusy(false);
    if (error) toast.error("Could not send: " + error.message);
    else toast.success(`${className} records sent (${students.length} learners).`);
  }

  return (
    <div className="space-y-1.5 border-t border-border pt-2">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Send to teacher</p>
      <select value={to} onChange={(e) => setTo(e.target.value)} className="h-9 w-full rounded-md border border-border bg-background px-2 text-xs">
        <option value="">{teachers.length ? "Choose a teacher…" : "No other teachers yet"}</option>
        {teachers.map((t) => (
          <option key={t.id} value={t.id}>{t.display_name || t.email}</option>
        ))}
      </select>
      <button disabled={!to || busy || students.length === 0} onClick={send} className="h-9 w-full rounded-md bg-primary text-xs font-semibold text-primary-foreground disabled:opacity-50">
        {busy ? "Sending…" : "Send records"}
      </button>
    </div>
  );
}
