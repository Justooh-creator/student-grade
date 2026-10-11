import { useNavigate } from "@tanstack/react-router";
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

export function PrintButton({ label = "Print / Save whole class as PDF (A4)" }: { label?: string }) {
  const { user, ready } = useUser();
  const lic = useLicense(user?.id);
  const { school } = useAppData();
  const navigate = useNavigate();

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

  const onPrint = () => {
    recordPrint(`${school.academicYear} ${school.term}`).catch(() => { /* offline: print still allowed */ });
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
