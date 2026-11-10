import { useCallback, useEffect, useRef, useState } from "react";
import { Fingerprint, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUser } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { fingerprintEnabled, RELOCK_AFTER_MS, verifyFingerprint, signOutWithFingerprint } from "@/lib/biometric";

export function FingerprintLock() {
  const { user } = useUser();
  const [locked, setLocked] = useState(false);
  const [error, setError] = useState("");
  const [signingOut, setSigningOut] = useState(false);
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
      if (document.hidden || document.querySelector("[data-fp-lock]")) return;
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

  // Auto-prompt once per lock event; failures/cancels stay locked and wait for a tap (no loops).
  const autoPrompted = useRef(false);
  useEffect(() => {
    if (!locked) { autoPrompted.current = false; return; }
    setError("");
    if (autoPrompted.current || document.hidden) return;
    const id = window.setTimeout(() => {
      if (autoPrompted.current) return;
      autoPrompted.current = true;
      void unlock();
    }, 300);
    return () => window.clearTimeout(id);
  }, [locked, unlock]);
  useEffect(() => {
    const onVis = () => {
      if (!document.hidden && locked && !autoPrompted.current) {
        autoPrompted.current = true;
        void unlock();
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [locked, unlock]);

  if (!locked || !user) return null;
  return (
    <div data-fp-lock className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-5 bg-background px-6 text-center">
      <img src="/icon-192.png" alt="EduReport logo" className="h-16 w-16 rounded-md" />
      <p className="font-display text-2xl font-black text-primary">EduReport</p>
      <div className="space-y-2">
        <h1 className="text-xl">Verify it is you</h1>
        <p className="text-muted-foreground">Use biometric for safe login</p>
      </div>
      <Button variant="outline" onClick={unlock} aria-label="Unlock with fingerprint" className="h-28 w-28 rounded-full border-2 border-primary p-6 text-primary [&_svg]:size-14">
        <Fingerprint className="h-14 w-14" />
      </Button>
      <p className="text-sm text-muted-foreground">Tap the fingerprint to unlock</p>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button variant="ghost" disabled={signingOut} onClick={async () => {
        if (signingOut) return;
        setSigningOut(true);
        setError("");
        try {
          const confirmed = await signOutWithFingerprint(user.id, async () => {
            const { error: signOutError } = await supabase.auth.signOut();
            if (signOutError) throw signOutError;
          });
          if (confirmed) setLocked(false);
          else setError("Sign-out was not confirmed. You are still signed in.");
        } catch {
          setError("Confirm with your fingerprint or device PIN/password to sign out. You are still signed in.");
        } finally { setSigningOut(false); }
      }}>
        <LogOut />{signingOut ? "Confirming…" : "Sign out"}
      </Button>
    </div>
  );
}
