import { useEffect, useState } from "react";
import { Fingerprint, ScanFace } from "lucide-react";
import { Button } from "@/components/ui/button";
import { disableFingerprint, enableFingerprint, fingerprintEnabled, fingerprintSupported } from "@/lib/biometric";

export function FingerprintSetting({ userId, email }: { userId: string; email: string }) {
  const [supported, setSupported] = useState<boolean | null>(null);
  const [on, setOn] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    setOn(fingerprintEnabled(userId));
    fingerprintSupported().then(setSupported);
  }, [userId]);

  if (supported === null) return null;
  if (!supported) return <p className="text-sm text-muted-foreground">Fingerprint and face unlock are not available on this device.</p>;

  async function toggle() {
    setMsg("");
    if (on) { disableFingerprint(userId); setOn(false); setMsg("Fingerprint / face unlock turned off."); return; }
    try { await enableFingerprint(userId, email); setOn(true); setMsg("Fingerprint / face unlock is on for this phone."); }
    catch { setMsg("Setup was cancelled or failed."); }
  }

  return (
    <div className="space-y-1">
      <Button variant="outline" className="h-12 w-full" onClick={toggle}>
        <Fingerprint /><ScanFace />{on ? "Turn off fingerprint / face unlock" : "Enable fingerprint / face unlock"}
      </Button>
      {msg && <p className="text-sm text-muted-foreground" role="status">{msg}</p>}
    </div>
  );
}
