import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCloud } from "@/lib/cloud";

export const DUTY_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"] as const;
export const DUTY_PRESETS = [
  "Teacher on Duty (whole week)",
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

export function buildRosterText(r: Pick<DutyRoster, "week_start" | "entries" | "notes">, schoolName?: string, onlyTeacher?: string) {
  const list = onlyTeacher ? r.entries.filter((e) => e.teacherId === onlyTeacher || e.teacherName === onlyTeacher) : r.entries;
  const lines = [`🗓️ *TEACHERS' DUTY ROSTER*${schoolName ? ` — ${schoolName}` : ""}`, `Week: ${weekLabel(r.week_start)}`, ""];
  for (const day of [...DUTY_DAYS, "All week"]) {
    const items = list.filter((e) => e.day === day);
    if (!items.length) continue;
    lines.push(`*${day}*`);
    for (const e of items) lines.push(`• ${e.teacherName || "—"}: ${e.duty}${e.time ? ` (${e.time})` : ""}${e.location ? ` @ ${e.location}` : ""}`);
    lines.push("");
  }
  if (r.notes) lines.push(r.notes);
  return lines.join("\n").trim();
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
  // Reminder: rosters for this or next week that assign me and I haven't acknowledged.
  const reminders = rosters.filter((r) =>
    (r.week_start === thisWeek || r.week_start === nextWeek) &&
    r.entries.some((e) => e.teacherId === cloud.userId) &&
    !acks.some((a) => a.roster_id === r.id && a.user_id === cloud.userId));

  return { rosters, acks, acknowledge, reload: load, reminders, cloud, thisWeek, nextWeek };
}
