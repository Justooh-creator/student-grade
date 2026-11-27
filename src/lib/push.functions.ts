import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getVapidPublicKey = createServerFn({ method: "GET" }).handler(async () => {
  return { publicKey: process.env["VAPID_PUBLIC_KEY"] ?? "" };
});

export const sendAnnouncementPush = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { title: string; body: string; audience: string; kind: string }) => input)
  .handler(async ({ data, context }) => {
    const { data: isDev } = await context.supabase.rpc("is_developer");
    if (!isDev) throw new Error("Forbidden");

    const publicKey = process.env["VAPID_PUBLIC_KEY"];
    const privateKey = process.env["VAPID_PRIVATE_KEY"];
    if (!publicKey || !privateKey) return { sent: 0, skipped: true };

    const [{ supabaseAdmin }, { sendWebPush }] = await Promise.all([
      import("@/integrations/supabase/client.server"),
      import("@/lib/webPush.server"),
    ]);

    let allowedUsers: Set<string> | null = null;
    if (data.audience === "heads") {
      const { data: heads } = await supabaseAdmin.from("school_members").select("user_id").eq("role", "headteacher").limit(1000);
      allowedUsers = new Set((heads ?? []).map((h) => h.user_id));
    }

    const { data: subs } = await supabaseAdmin
      .from("push_subscriptions")
      .select("id, user_id, endpoint, p256dh, auth")
      .limit(1000);

    const targets = (subs ?? []).filter((s) => s.endpoint && s.p256dh && s.auth && (!allowedUsers || allowedUsers.has(s.user_id)));
    const goneIds: string[] = [];
    let sent = 0;

    await Promise.allSettled(
      targets.map(async (sub) => {
        const res = await sendWebPush(
          sub,
          { title: data.title, body: data.body.slice(0, 180), url: "/setup", tag: `edureport-notice-${Date.now()}` },
          { publicKey, privateKey },
        );
        if (res.ok) sent++;
        else if (res.gone) goneIds.push(sub.id);
      }),
    );

    if (goneIds.length) {
      await supabaseAdmin.from("push_subscriptions").delete().in("id", goneIds);
    }
    return { sent, skipped: false };
  });