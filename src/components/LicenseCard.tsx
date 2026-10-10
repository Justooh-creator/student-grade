import { useState } from "react";
import { toast } from "sonner";
import { licenseLabel, redeemCode, type LicenseState } from "@/lib/license";

/** License status + gift/activation code entry. Shown on the School Cloud page. */
export function LicenseCard({ lic, onActivated }: { lic: LicenseState; onActivated: (l: LicenseState) => void }) {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  async function activate() {
    if (!code.trim()) return;
    setBusy(true);
    try {
      const next = await redeemCode(code.trim());
      onActivated(next);
      setCode("");
      toast.success(next.canPrint ? "Activated! Save/Print PDF is now unlocked." : "Code accepted.");
    } catch (e) {
      toast.error((e as Error).message);
    }
    setBusy(false);
  }

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <p className="font-bold">License &amp; activation</p>
      <p className="mt-1 text-sm">
        Status: <b className={lic.canPrint ? "text-primary" : "text-destructive"}>{licenseLabel(lic)}</b>
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        Entering learners, marks and previewing report cards is always free. Save/Print PDF needs an active license.
      </p>
      <label className="mt-3 block text-sm font-bold">Gift / activation code
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="e.g. XXXX-XXXX"
          className="num mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm uppercase tracking-widest"
        />
      </label>
      <button
        onClick={activate}
        disabled={busy || code.trim().length < 4}
        className="mt-3 rounded-md bg-primary px-4 py-2 text-sm font-bold text-primary-foreground disabled:opacity-50"
      >
        {busy ? "Checking…" : "Activate"}
      </button>
    </div>
  );
}
