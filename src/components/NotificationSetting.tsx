import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { disableDeviceNotifications, enableDeviceNotifications, getDeviceNotificationState, NOTIFICATION_CHANGE, type NotificationState } from "@/lib/pushNotifications";

export function NotificationSetting({ userId, schoolId }: { userId?: string | null | undefined; schoolId?: string | null | undefined }) {
  const [state, setState] = useState<NotificationState>("default");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let alive = true;
    const refresh = async () => { const next = await getDeviceNotificationState(); if (alive) setState(next); };
    void refresh();
    window.addEventListener(NOTIFICATION_CHANGE, refresh);
    window.addEventListener("focus", refresh);
    return () => { alive = false; window.removeEventListener(NOTIFICATION_CHANGE, refresh); window.removeEventListener("focus", refresh); };
  }, [userId]);

  const toggle = async (on: boolean) => {
    setBusy(true);
    try {
      if (on) {
        const res = await enableDeviceNotifications({ userId, schoolId });
        if (!res.ok) toast.error(res.reason);
        else toast.success("Phone notifications are ON.");
      } else {
        await disableDeviceNotifications(userId);
        toast.success("Phone notifications are OFF. In-app duty reminders remain visible.");
      }
    } catch (error) { toast.error(error instanceof Error ? error.message : "Could not change notifications. Try again."); }
    finally { setState(await getDeviceNotificationState()); setBusy(false); }
  };

  return <div className="space-y-2 text-sm">
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-md border border-border bg-muted/40 px-3 py-3">
      <label htmlFor="phone-duty-notifications" className="min-w-0 font-semibold"><Bell className="mr-2 inline size-4 text-primary" />Phone & Duty Notifications<span className="mt-1 block text-xs text-muted-foreground">{busy ? "Updating…" : state === "granted" ? "ON — phone alerts active" : "OFF — phone alerts muted"}</span></label>
      <Switch id="phone-duty-notifications" checked={state === "granted"} disabled={busy || state === "unsupported"} onCheckedChange={(on) => void toggle(on)} />
    </div>
    <p className="text-xs text-muted-foreground">Friday & Sunday duty reminders and broadcast notices, even when EduReport is closed. This setting applies to this device.</p>
    {state === "unsupported" && <p className="text-xs text-muted-foreground">On iPhone, add EduReport to your Home Screen first. This browser does not support phone alerts.</p>}
    {state === "denied" && <p className="text-xs text-destructive">Your browser has blocked notifications. Allow EduReport in your phone's site settings, then turn this ON.</p>}
  </div>;
}
