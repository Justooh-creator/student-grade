import { useEffect, useState } from "react";
import { registerAppServiceWorker } from "@/lib/registerSW";

export function OfflineStatus() {
  const [state, setState] = useState<"online" | "offline" | "back">("online");

  useEffect(() => {
    registerAppServiceWorker();
    if (!navigator.onLine) setState("offline");
    let t: ReturnType<typeof setTimeout> | undefined;
    const off = () => setState("offline");
    const on = () => {
      setState("back");
      clearTimeout(t);
      t = setTimeout(() => setState("online"), 4000);
    };
    window.addEventListener("offline", off);
    window.addEventListener("online", on);
    return () => {
      window.removeEventListener("offline", off);
      window.removeEventListener("online", on);
      clearTimeout(t);
    };
  }, []);

  if (state === "online") return null;
  return (
    <div
      role="status"
      className={`fixed inset-x-0 top-0 z-[60] px-3 py-1.5 text-center text-xs font-semibold shadow print:hidden ${
        state === "offline" ? "bg-accent text-accent-foreground" : "bg-primary text-primary-foreground"
      }`}
    >
      {state === "offline"
        ? "📶 Working offline — changes are saved on this phone"
        : "✅ Back online — syncing records…"}
    </div>
  );
}
