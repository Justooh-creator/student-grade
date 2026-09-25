import { useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/lib/auth";
import { updateData, type Student } from "@/lib/store";

type Share = { id: string; sender_name: string; class_id: string; payload: unknown; updated_at: string };

const SEEN_KEY = "sba-shares-seen";

function apply(share: Share, notify: boolean) {
  const seen = JSON.parse(localStorage.getItem(SEEN_KEY) || "{}") as Record<string, string>;
  if (seen[share.id] === share.updated_at) return;
  const incoming = Array.isArray(share.payload) ? (share.payload as Student[]) : [];
  updateData((cur) => {
    const map = new Map(cur.students.map((s) => [s.id, s]));
    incoming.forEach((s) => map.set(s.id, { ...map.get(s.id), ...s }));
    return { ...cur, students: [...map.values()] };
  });
  seen[share.id] = share.updated_at;
  localStorage.setItem(SEEN_KEY, JSON.stringify(seen));
  if (notify) toast.success(`Received ${incoming.length} ${share.class_id.toUpperCase()} record(s) from ${share.sender_name || "a teacher"}.`);
}

export function SyncListener() {
  const { user } = useUser();
  useEffect(() => {
    if (!user) return;
    supabase.from("record_shares").select("id, sender_name, class_id, payload, updated_at").eq("recipient_id", user.id)
      .then(({ data }) => (data ?? []).forEach((s) => apply(s as Share, true)));
    const channel = supabase
      .channel(`shares-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "record_shares", filter: `recipient_id=eq.${user.id}` },
        (p) => { if (p.new && "id" in p.new) apply(p.new as Share, true); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);
  return null;
}
