import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { getClassLevel, type ClassId } from "@/lib/ges";
import { toast } from "sonner";
import { useUser } from "@/lib/auth";
import { recordPrint, useLicense } from "@/lib/license";
import { useAppData } from "@/lib/store";

type PrintBridge = { print?: () => void };

function printReports() {
  const w = window as unknown as { AndroidPrint?: PrintBridge; AndroidBridge?: PrintBridge };
  const bridge = w.AndroidPrint?.print ? w.AndroidPrint : w.AndroidBridge?.print ? w.AndroidBridge : undefined;
  // Let images (logo, photos, signature) finish loading before printing.
  const imgs = Array.from(document.images).filter((i) => !i.complete);
  Promise.all(imgs.map((i) => new Promise((r) => { i.onload = i.onerror = r; setTimeout(r, 3000); }))).then(() => {
    try {
      if (bridge?.print) bridge.print();
      else window.print();
    } catch {
      window.print();
    }
  });
}

/** Same license check as printing, for data exports (Excel); never records a print or locks a term. */
export function LicensedExportButton({ label, onExport }: { label: string; onExport: () => Promise<void> }) {
  const { user, ready } = useUser();
  const lic = useLicense(user?.id);
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  if (ready && !lic.loading && !lic.canPrint) {
    return <button onClick={() => navigate({ to: "/school-cloud" })} title="Exporting needs an active license. Tap to activate." className="h-10 cursor-not-allowed rounded-md border border-border bg-muted px-5 text-sm font-semibold text-muted-foreground">🔒 Excel export locked - Activate licence</button>;
  }
  const run = async () => {
    setBusy(true);
    try { await onExport(); toast.success("Excel broadsheet downloaded."); }
    catch { toast.error("Could not create the Excel file. Please try again."); }
    finally { setBusy(false); }
  };
  return <button onClick={run} disabled={busy} className="h-10 rounded-md border border-primary bg-background px-5 text-sm font-semibold text-primary hover:bg-primary/10 disabled:opacity-60">{busy ? "Preparing Excel…" : label}</button>;
}

export function PrintButton({ label = "Print / Save whole class as PDF (A4)", classId, reportCards = false }: { label?: string; classId?: string; reportCards?: boolean }) {
  const { user, ready } = useUser();
  const lic = useLicense(user?.id);
  const { school } = useAppData();
  const navigate = useNavigate();
  const [lockedClass, setLockedClass] = useState<string | null>(null);

  const locked = ready && !lic.loading && !lic.canPrint;

  if (locked) {
    return (
      <button
        onClick={() => navigate({ to: "/school-cloud" })}
        title="Printing needs an active license. Tap to activate."
        className="h-10 cursor-not-allowed rounded-md border border-border bg-muted px-5 text-sm font-semibold text-muted-foreground"
      >
        🔒 Save Pdf/print locked - Activate licence
      </button>
    );
  }

  if (lockedClass) {
    const name = getClassLevel(lockedClass as ClassId)?.name ?? lockedClass.toUpperCase();
    return (
      <div className="max-w-md rounded-md border border-border bg-muted p-3 text-sm">
        <p>🔒 Your Individual Teacher license is assigned to <strong>{name}</strong>. To print report cards for other classes, upgrade to the School Cloud plan.</p>
        <button onClick={() => navigate({ to: "/school-cloud" })} className="mt-2 h-9 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground">Upgrade license</button>
      </div>
    );
  }

  const onPrint = async () => {
    try {
      const r = await recordPrint(`${school.academicYear} ${school.term}`, classId);
      if (r.classBlocked) { setLockedClass(r.lockedClass ?? ""); return; }
      if (r.blocked) {
        toast.error(`Your 1-term license is for ${r.lockedTerm}. Buy a new term or a 3-term plan to print ${school.academicYear} ${school.term}.`);
        return;
      }
    } catch { /* offline: print still allowed */ }
    printReports();
  };

  return (
    <button
      onClick={onPrint}
      disabled={!ready || lic.loading}
      className="h-10 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
    >
      {label}
    </button>
  );
}
