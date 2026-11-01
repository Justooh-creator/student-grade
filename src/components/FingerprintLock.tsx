import { useCallback, useEffect, useRef, useState } from "react";
import { Fingerprint, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUser } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { fingerprintEnabled, RELOCK_AFTER_MS, verifyFingerprint } from "@/lib/biometric";

export function FingerprintLock() {
  const { user } = useUser();
  const [locked, setLocked] = useState(false);
  const [error, setError] = useState("");
  const hiddenAt = useRef<number | null>(null);

  const activeKey = user ? `edureport:fp-active:${user.id}` : "";
  const markActive = useCallback(() => {
    if (activeKey) localStorage.setItem(activeKey, String(Date.now()));
  }, [activeKey]);

  const unlock = useCallback(async () => {
    if (!user) return;
    setError("");
    try {
      if (await verifyFingerprint(user.id)) { markActive(); setLocked(false); }
    } catch {
      setError("Fingerprint not recognised. Try again.");
    }
  }, [user, markActive]);

  useEffect(() => {
    if (!user || !fingerprintEnabled(user.id)) { setLocked(false); return; }
    const isStale = () => {
      const last = Number(localStorage.getItem(activeKey) || 0);
      return !last || Date.now() - last > RELOCK_AFTER_MS;
    };
    // Refresh within 2 minutes of activity stays unlocked; login / long idle locks.
    if (isStale()) setLocked(true); else markActive();
    let lastWrite = 0;
    const onActivity = () => {
      if (document.hidden) return;
      const now = Date.now();
      if (now - lastWrite > 5000) { lastWrite = now; markActive(); }
    };
    const events = ["pointerdown", "keydown", "scroll", "touchstart"] as const;
    events.forEach((e) => window.addEventListener(e, onActivity, { passive: true }));
    const onVis = () => {
      if (!document.hidden && fingerprintEnabled(user.id) && isStale()) setLocked(true);
    };
    const timer = window.setInterval(() => {
      if (fingerprintEnabled(user.id) && isStale()) setLocked(true);
    }, 10_000);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      events.forEach((e) => window.removeEventListener(e, onActivity));
      document.removeEventListener("visibilitychange", onVis);
      window.clearInterval(timer);
    };
  }, [user, activeKey, markActive]);

  useEffect(() => {
    if (locked && user) unlock();
  }, [locked, user, unlock]);

  if (!locked || !user) return null;
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-5 bg-background px-6 text-center">
      <img src="/icon-192.png" alt="EduReport logo" className="h-16 w-16 rounded-md" />
      <p className="font-display text-2xl font-black text-primary">EduReport Ghana</p>
      <button onClick={unlock} aria-label="Unlock with fingerprint" className="rounded-full border-2 border-primary p-6 text-primary">
        <Fingerprint className="h-14 w-14" />
      </button>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button variant="ghost" onClick={async () => { await supabase.auth.signOut(); setLocked(false); }}>
        <LogOut />Use password instead
      </Button>
    </div>
  );
}
