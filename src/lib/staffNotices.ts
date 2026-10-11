import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCloud } from "@/lib/cloud";

export type StaffNotice = {
  id: string;
  school_id: string;
  created_by: string;
  sender_name: string;
  title: string;
  meeting_date: string;
  meeting_time: string;
  venue: string;
  agenda: string;
  notes: string;
  created_at: string;
};

export function buildStaffNoticeText(n: Pick<StaffNotice, "title" | "meeting_date" | "meeting_time" | "venue" | "agenda" | "notes" | "sender_name">, schoolName?: string) {
  const lines = [
    `📢 *STAFF MEETING NOTICE*${schoolName ? ` — ${schoolName}` : ""}`,
    "",
    `*${n.title || "Staff Meeting"}*`,
    n.meeting_date && `📅 Date: ${n.meeting_date}`,
    n.meeting_time && `⏰ Time: ${n.meeting_time}`,
    n.venue && `📍 Venue: ${n.venue}`,
    n.agenda && `\n*Agenda:*\n${n.agenda}`,
    n.notes && `\n${n.notes}`,
    "",
    `— ${n.sender_name || "Headteacher"}`,
  ];
  return lines.filter((l) => l !== "" && l !== undefined && l !== false).join("\n").replace(/\n(?=📅|\*)/g, "\n");
}

export function useStaffNotices() {
  const cloud = useCloud();
  const [notices, setNotices] = useState<StaffNotice[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [reads, setReads] = useState<{ notice_id: string; user_id: string }[]>([]);

  const load = useCallback(async () => {
    if (!cloud.schoolId) { setNotices([]); return; }
    const { data } = await supabase.from("staff_notices").select("*").eq("school_id", cloud.schoolId).order("created_at", { ascending: false }).limit(30);
    const list = (data ?? []) as StaffNotice[];
    setNotices(list);
    if (list.length) {
      const { data: r } = await supabase.from("staff_notice_reads").select("notice_id, user_id").in("notice_id", list.map((n) => n.id));
      setReads(r ?? []);
      setReadIds(new Set((r ?? []).filter((x) => x.user_id === cloud.userId).map((x) => x.notice_id)));
    }
  }, [cloud.schoolId, cloud.userId]);

  useEffect(() => {
    load();
    if (!cloud.schoolId) return;
    const ch = supabase
      .channel(`staff-notices-${cloud.schoolId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "staff_notices", filter: `school_id=eq.${cloud.schoolId}` }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [cloud.schoolId, load]);

  const acknowledge = async (id: string) => {
    if (!cloud.userId) return;
    setReadIds((s) => new Set(s).add(id));
    await supabase.from("staff_notice_reads").insert({ notice_id: id, user_id: cloud.userId });
    load();
  };

  const unread = notices.filter((n) => !readIds.has(n.id) && n.created_by !== cloud.userId);
  return { notices, unread, reads, acknowledge, reload: load, cloud };
}
