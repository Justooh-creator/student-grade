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
  return (
    <button
      onClick={printReports}
      className="h-10 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground hover:opacity-90"
    >
      {label}
    </button>
  );
}
