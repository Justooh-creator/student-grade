import { createFileRoute } from "@tanstack/react-router";
import { authenticateCronRequest } from "@/integrations/supabase/cron-auth";
import { mondayOf, type DutyEntry } from "@/lib/dutyRoster";

export const Route = createFileRoute("/api/public/jobs/duty-reminders")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const authFailure = await authenticateCronRequest(request);
        if (authFailure) return authFailure;

        const publicKey = process.env["VAPID_PUBLIC_KEY"];
        const privateKey = process.env["VAPID_PRIVATE_KEY"];
        if (!publicKey || !privateKey) {
          return Response.json({ ok: false, reason: "VAPID keys not configured" }, { status: 500 });
        }

        const body = (await request.json().catch(() => ({}))) as { kind?: "friday" | "sunday" };
        const kind = body.kind === "sunday" ? "sunday" : "friday";
        const nextWeek = mondayOf(new Date(), 1);

        const [{ supabaseAdmin }, { sendWebPush }] = await Promise.all([
          import("@/integrations/supabase/client.server"),
          import("@/lib/webPush.server"),
        ]);

        const { data: rosters } = await supabaseAdmin
          .from("duty_rosters")
          .select("id, entries")
          .eq("week_start", nextWeek)
          .limit(500);

        if (!rosters?.length) return Response.json({ ok: true, sent: 0, kind });

        const rosterIds = rosters.map((r) => r.id);
        const { data: acks } = await supabaseAdmin
          .from("duty_roster_acks")
          .select("roster_id, user_id")
          .in("roster_id", rosterIds)
          .limit(1000);

        const ackSet = new Set((acks ?? []).map((a) => `${a.roster_id}:${a.user_id}`));
        const pendingTeacherIds = new Set<string>();
        for (const r of rosters) {
          const entries = Array.isArray(r.entries) ? (r.entries as unknown as DutyEntry[]) : [];
          for (const e of entries) {
            if (e.teacherId && !ackSet.has(`${r.id}:${e.teacherId}`)) {
              pendingTeacherIds.add(e.teacherId);
            }
          }
        }

        if (!pendingTeacherIds.size) return Response.json({ ok: true, sent: 0, kind });

        const { data: subs } = await supabaseAdmin
          .from("push_subscriptions")
          .select("id, user_id, endpoint, p256dh, auth")
          .in("user_id", [...pendingTeacherIds])
          .limit(1000);

        const payload =
          kind === "sunday"
            ? {
                title: "Tomorrow is your Duty Day",
                body: "Your school duty begins Monday morning. Open EduReport to view and acknowledge.",
                url: "/duty-roster",
                tag: `duty-sunday-${nextWeek}`,
              }
            : {
                title: "Upcoming Duty Next Week",
                body: "You are assigned to school duty starting next Monday. Open EduReport to acknowledge.",
                url: "/duty-roster",
                tag: `duty-friday-${nextWeek}`,
              };

        const goneIds: string[] = [];
        let sent = 0;
        await Promise.allSettled(
          (subs ?? []).map(async (sub) => {
            if (!sub.endpoint || !sub.p256dh || !sub.auth) return;
            const res = await sendWebPush(sub, payload, { publicKey, privateKey });
            if (res.ok) sent++;
            else if (res.gone) goneIds.push(sub.id);
          }),
        );

        if (goneIds.length) {
          await supabaseAdmin.from("push_subscriptions").delete().in("id", goneIds);
        }

        return Response.json({ ok: true, sent, kind, week: nextWeek });
      },
    },
  },
});