import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCloud } from "@/lib/cloud";

export const DUTY_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"] as const;
export const DUTY_PRESETS = [
  "Teacher on Duty",
  "Morning Assembly",
  "Break Duty",
  "Lunch Duty",
  "Closing / Dismissal",
  "Gate / Compound",
  "Classroom Inspection",
  "Worship / Devotion",
  "Sanitation / Clean-up",
];

export type DutyEntry = { day: string; duty: string; time: string; location: string; teacherId: string; teacherName: string };
export type DutyRoster = { id: string; school_id: string; created_by: string; week_start: string; entries: DutyEntry[]; notes: string; updated_at: string };

/** Monday (yyyy-mm-dd) of the week containing `d`, shifted by `offsetWeeks`. */
export function mondayOf(d = new Date(), offsetWeeks = 0): string {
  const x = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dow = (x.getUTCDay() + 6) % 7;
  x.setUTCDate(x.getUTCDate() - dow + offsetWeeks * 7);
  return x.toISOString().slice(0, 10);
}

export function weekLabel(weekStart: string) {
  const s = new Date(weekStart + "T00:00:00Z");
  const e = new Date(s); e.setUTCDate(e.getUTCDate() + 4);
  const f = (d: Date) => d.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
  return `${f(s)} – ${f(e)} ${e.getUTCFullYear()}`;
}

const cleanDutyLabel = (d: string) => d.replace(/\s*\(whole week\)/gi, "").trim() || "Teacher on Duty";

export function buildRosterText(r: Pick<DutyRoster, "week_start" | "entries" | "notes">, schoolName?: string, onlyTeacher?: string) {
  const list = onlyTeacher ? r.entries.filter((e) => e.teacherId === onlyTeacher || e.teacherName === onlyTeacher) : r.entries;
  const lines = [`🗓️ *TEACHERS' DUTY ROSTER*${schoolName ? ` — ${schoolName}` : ""}`, `Week: ${weekLabel(r.week_start)}`, ""];
  const general = list.filter((e) => !DUTY_DAYS.includes(e.day as (typeof DUTY_DAYS)[number]));
  if (general.length) {
    for (const e of general) lines.push(`• ${e.teacherName || "—"}: ${cleanDutyLabel(e.duty)}${e.time ? ` (${e.time})` : ""}${e.location ? ` @ ${e.location}` : ""}`);
    lines.push("");
  }
  for (const day of DUTY_DAYS) {
    const items = list.filter((e) => e.day === day);
    if (!items.length) continue;
    lines.push(`*${day}*`);
    for (const e of items) lines.push(`• ${e.teacherName || "—"}: ${cleanDutyLabel(e.duty)}${e.time ? ` (${e.time})` : ""}${e.location ? ` @ ${e.location}` : ""}`);
    lines.push("");
  }
  if (r.notes) lines.push(r.notes);
  return lines.join("\n").trim();
}

export interface DutyReminderInfo {
  reminders: DutyRoster[];
  bannerText: string | null;
  notificationTitle: string | null;
  notificationBody: string | null;
  isFriday: boolean;
  isSunday: boolean;
}

/** Compute active/upcoming duty reminders with tailored Friday advance notice and Sunday "Tomorrow is Duty Day" copy. */
export function dutyReminderContext(
  rosters: DutyRoster[],
  acks: { roster_id: string; user_id: string }[],
  userId: string | null | undefined,
  now = new Date(),
): DutyReminderInfo {
  const thisWeek = mondayOf(now);
  const nextWeek = mondayOf(now, 1);
  const dow = now.getDay(); // 0 = Sunday, 5 = Friday
  const isFriday = dow === 5;
  const isSunday = dow === 0;
  if (!userId) return { reminders: [], bannerText: null, notificationTitle: null, notificationBody: null, isFriday, isSunday };

  const unacked = rosters.filter((r) =>
    (r.week_start === thisWeek || r.week_start === nextWeek) &&
    r.entries.some((e) => e.teacherId === userId) &&
    !acks.some((a) => a.roster_id === r.id && a.user_id === userId));
  if (!unacked.length) return { reminders: [], bannerText: null, notificationTitle: null, notificationBody: null, isFriday, isSunday };

  const hasNext = unacked.some((r) => r.week_start === nextWeek);
  const hasThis = unacked.some((r) => r.week_start === thisWeek);
  if (isSunday && hasNext) {
    return {
      reminders: unacked,
      bannerText: "🗓️ Tomorrow is your Duty Day! Tap to view your duty roster and acknowledge.",
      notificationTitle: "Tomorrow is your Duty Day",
      notificationBody: "Your school duty begins Monday morning. Open EduReport to view and acknowledge.",
      isFriday,
      isSunday,
    };
  }
  if (isFriday && hasNext) {
    return {
      reminders: unacked,
      bannerText: "🗓️ Friday reminder: You are on duty next week — tap to view and acknowledge.",
      notificationTitle: "Upcoming Duty Next Week",
      notificationBody: "You are assigned to school duty starting next Monday. Open EduReport to acknowledge.",
      isFriday,
      isSunday,
    };
  }
  const label = hasThis ? "this week" : "next week";
  return {
    reminders: unacked,
    bannerText: `🗓️ You are on duty ${label} — tap to view and acknowledge`,
    notificationTitle: `Duty Roster Reminder (${label})`,
    notificationBody: `You are on duty ${label}. Open EduReport to view and acknowledge.`,
    isFriday,
    isSunday,
  };
}

export function useDutyRosters() {
  const cloud = useCloud();
  const [rosters, setRosters] = useState<DutyRoster[]>([]);
  const [acks, setAcks] = useState<{ roster_id: string; user_id: string }[]>([]);

  const load = useCallback(async () => {
    if (!cloud.schoolId) { setRosters([]); return; }
    const { data } = await supabase.from("duty_rosters").select("*").eq("school_id", cloud.schoolId)
      .gte("week_start", mondayOf(new Date(), -20)).order("week_start", { ascending: false });
    const list = (data ?? []) as unknown as DutyRoster[];
    setRosters(list);
    if (list.length) {
      const { data: a } = await supabase.from("duty_roster_acks").select("roster_id, user_id").in("roster_id", list.map((r) => r.id));
      setAcks(a ?? []);
    }
  }, [cloud.schoolId]);

  useEffect(() => {
    load();
    if (!cloud.schoolId) return;
    const ch = supabase.channel(`duty-${cloud.schoolId}-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "duty_rosters", filter: `school_id=eq.${cloud.schoolId}` }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [cloud.schoolId, load]);

  const acknowledge = async (id: string) => {
    if (!cloud.userId) return;
    setAcks((a) => [...a, { roster_id: id, user_id: cloud.userId! }]);
    await supabase.from("duty_roster_acks").insert({ roster_id: id, user_id: cloud.userId });
  };

  const thisWeek = mondayOf();
  const nextWeek = mondayOf(new Date(), 1);
  const reminderInfo = dutyReminderContext(rosters, acks, cloud.userId);
  const reminders = reminderInfo.reminders;

  useEffect(() => {
    if (!reminderInfo.notificationTitle || !reminderInfo.notificationBody || typeof window === "undefined" || !("Notification" in window) || Notification.permission !== "granted") return;
    const todayKey = `edureport-duty-notified:${new Date().toISOString().slice(0, 10)}:${reminders[0]?.id ?? ""}`;
    try {
      if (localStorage.getItem(todayKey)) return;
      localStorage.setItem(todayKey, "1");
    } catch { /* ignore */ }
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        reg.showNotification(reminderInfo.notificationTitle!, { body: reminderInfo.notificationBody!, icon: "/icon-192.png", tag: todayKey, data: { url: "/duty-roster" } });
      }).catch(() => {
        try { new Notification(reminderInfo.notificationTitle!, { body: reminderInfo.notificationBody! }); } catch { /* ignore */ }
      });
    } else {
      try { new Notification(reminderInfo.notificationTitle!, { body: reminderInfo.notificationBody! }); } catch { /* ignore */ }
    }
  }, [reminderInfo.notificationTitle, reminderInfo.notificationBody, reminders]);

  return { rosters, acks, acknowledge, reload: load, reminders, reminderInfo, cloud, thisWeek, nextWeek };
}
