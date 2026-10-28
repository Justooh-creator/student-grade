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

  const unlock = useCallback(async () => {
    if (!user) return;
    setError("");
    try {
      if (await verifyFingerprint(user.id)) setLocked(false);
    } catch {
      setError("Fingerprint not recognised. Try again.");
    }
  }, [user]);

  useEffect(() => {
    if (!user || !fingerprintEnabled(user.id)) { setLocked(false); return; }
    setLocked(true);
    const onVis = () => {
      if (document.hidden) hiddenAt.current = Date.now();
      else if (hiddenAt.current && Date.now() - hiddenAt.current > RELOCK_AFTER_MS && fingerprintEnabled(user.id)) setLocked(true);
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [user]);

  if (!locked || !user) return null;
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-5 bg-background px-6 text-center">
      <img src="/icon-192.png" alt="EduReport logo" className="h-16 w-16 rounded-md" />
      <p className="font-display text-2xl font-black text-primary">EduReport Ghana</p>
      <button onClick={unlock} aria-label="Unlock with fingerprint" className="rounded-full border-2 border-primary p-6 text-primary">
        <Fingerprint className="h-14 w-14" />
      </button>
      <p className="text-muted-foreground">Touch to unlock with your fingerprint</p>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button variant="ghost" onClick={async () => { await supabase.auth.signOut(); setLocked(false); }}>
        <LogOut />Use password instead
      </Button>
    </div>
  );
}
