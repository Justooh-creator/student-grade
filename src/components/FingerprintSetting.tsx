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

  async function toggle() {
    setMsg("");
    if (on) { disableFingerprint(userId); setOn(false); setMsg("Fingerprint / face unlock turned off."); return; }
    if (!supported) { setMsg("This app version blocks the phone's fingerprint and face sensor. Open edureportghana.com in Google Chrome, tap ⋮ → Install app, then turn this on from the installed EduReport app."); return; }
    try { await enableFingerprint(userId, email); setOn(true); setMsg("Fingerprint / face unlock is on for this phone."); }
    catch { setMsg("Setup was cancelled or this phone blocked it. Make sure a fingerprint or face is set up in phone Settings, then open EduReport in Chrome or the installed app and try again."); }
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
