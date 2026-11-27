import { supabase } from "@/integrations/supabase/client";
import { getVapidPublicKey } from "@/lib/push.functions";

export type NotificationState = "unsupported" | "denied" | "default" | "granted";
const OPT_OUT_KEY = "edureport-push-opt-out";
let cachedVapidKey: string | null = null;

async function resolveVapidPublicKey(): Promise<string> {
  if (cachedVapidKey !== null) return cachedVapidKey;
  const envKey = (import.meta.env["VITE_VAPID_PUBLIC_KEY"] as string | undefined)?.trim();
  if (envKey) {
    cachedVapidKey = envKey;
    return envKey;
  }
  try {
    const res = await getVapidPublicKey();
    cachedVapidKey = res.publicKey?.trim() ?? "";
  } catch {
    cachedVapidKey = "";
  }
  return cachedVapidKey;
}

export function getNotificationState(): NotificationState {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
  return Notification.permission as NotificationState;
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

export async function showLocalNotification(title: string, body: string, url = "/duty-roster") {
  if (typeof window === "undefined" || !("Notification" in window) || Notification.permission !== "granted") return;
  if ("serviceWorker" in navigator) {
    try {
      const reg = await navigator.serviceWorker.ready;
      await reg.showNotification(title, { body, icon: "/icon-192.png", badge: "/icon-192.png", data: { url } });
      return;
    } catch { /* fallback below */ }
  }
  try { new Notification(title, { body, icon: "/icon-192.png" }); } catch { /* ignore */ }
}

async function syncPushSubscription(opts: { userId?: string | null | undefined; schoolId?: string | null | undefined }) {
  const vapidKey = await resolveVapidPublicKey();
  if (!vapidKey || !("serviceWorker" in navigator) || !("PushManager" in window) || !opts.userId) return false;
  try {
    const reg = await navigator.serviceWorker.ready;
    const existing = await reg.pushManager.getSubscription();
    const sub = existing ?? await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey) as BufferSource,
    });
    const json = sub.toJSON();
    if (!json.endpoint) return false;
    await supabase.from("push_subscriptions").upsert({
      user_id: opts.userId,
      school_id: opts.schoolId ?? null,
      endpoint: json.endpoint,
      p256dh: json.keys?.["p256dh"] ?? "",
      auth: json.keys?.["auth"] ?? "",
      updated_at: new Date().toISOString(),
    }, { onConflict: "endpoint" });
    return true;
  } catch {
    return false;
  }
}

/** Request OS notification permission and register a Web Push subscription when VAPID key is configured. */
export async function enableDeviceNotifications(opts: { userId?: string | null | undefined; schoolId?: string | null | undefined }) {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return { ok: false as const, reason: "This browser does not support device notifications." };
  }
  try { localStorage.removeItem(OPT_OUT_KEY); } catch { /* ignore */ }
  const perm = Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
  if (perm !== "granted") {
    return { ok: false as const, reason: "Notifications were blocked. Allow them in your browser site settings." };
  }
  const pushRegistered = await syncPushSubscription(opts);
  await showLocalNotification("EduReport Alerts Enabled", "You will receive duty roster and school notices on this device.");
  return { ok: true as const, pushRegistered };
}

/** Default-ON push subscription on sign-in unless the user explicitly unsubscribed in Settings. */
export async function autoSubscribeNotifications(opts: { userId?: string | null | undefined; schoolId?: string | null | undefined }) {
  if (typeof window === "undefined" || !("Notification" in window) || !opts.userId) return;
  try { if (localStorage.getItem(OPT_OUT_KEY) === "1") return; } catch { /* ignore */ }
  if (Notification.permission === "denied") return;
  if (Notification.permission === "default") {
    const perm = await Notification.requestPermission().catch(() => "default" as NotificationPermission);
    if (perm !== "granted") return;
  }
  await syncPushSubscription(opts);
}

export async function disableDeviceNotifications(userId?: string | null) {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  try { localStorage.setItem(OPT_OUT_KEY, "1"); } catch { /* ignore */ }
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) {
      const endpoint = sub.endpoint;
      await sub.unsubscribe();
      if (userId) await supabase.from("push_subscriptions").delete().eq("user_id", userId).eq("endpoint", endpoint);
    }
  } catch { /* ignore */ }
}