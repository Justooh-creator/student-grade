export function PrintButton({ label = "Print / Save whole class as PDF (A4)" }: { label?: string }) {
  return (
    <button
      onClick={() => window.print()}
      className="h-10 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground hover:opacity-90"
    >
      {label}
    </button>
  );
}
