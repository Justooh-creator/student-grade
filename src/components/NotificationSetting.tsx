import { useEffect, useState } from "react";
import { Bell, BellOff } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { disableDeviceNotifications, enableDeviceNotifications, getNotificationState, type NotificationState } from "@/lib/pushNotifications";

export function NotificationSetting({ userId, schoolId }: { userId?: string | null | undefined; schoolId?: string | null | undefined }) {
  const [state, setState] = useState<NotificationState>("default");
  const [busy, setBusy] = useState(false);

  useEffect(() => { setState(getNotificationState()); }, []);

  const enable = async () => {
    setBusy(true);
    const res = await enableDeviceNotifications({ userId, schoolId });
    setBusy(false);
    setState(getNotificationState());
    if (!res.ok) { toast.error(res.reason); return; }
    toast.success("Device notifications enabled");
  };

  const disable = async () => {
    setBusy(true);
    await disableDeviceNotifications(userId);
    setBusy(false);
    toast.success("Background push unsubscribed. You can also mute notifications in browser settings.");
  };

  if (state === "unsupported") {
    return <p className="text-sm text-muted-foreground">This browser does not support device notifications. On iPhone, add EduReport to your Home Screen first.</p>;
  }

  return (
    <div className="space-y-2 text-sm">
      <p className="text-muted-foreground">
        Receive Friday & Sunday duty roster alerts and school notices directly on your phone.
      </p>
      {state === "granted" ? (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border bg-muted/40 px-3 py-2">
          <span className="flex items-center gap-2 font-semibold text-primary"><Bell className="h-4 w-4" /> Notifications are enabled</span>
          <Button size="sm" variant="outline" disabled={busy} onClick={disable}><BellOff className="mr-1 h-4 w-4" /> Unsubscribe</Button>
        </div>
      ) : state === "denied" ? (
        <p className="text-xs text-destructive">Notifications are blocked in your browser settings. Open site settings to allow notifications for EduReport.</p>
      ) : (
        <Button type="button" disabled={busy} onClick={enable}>
          <Bell className="mr-2 h-4 w-4" /> {busy ? "Enabling…" : "Enable device notifications"}
        </Button>
      )}
    </div>
  );
}