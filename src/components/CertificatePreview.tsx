import { useEffect, useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Maximize, ZoomIn } from "lucide-react";

/** Screen-only fitting: the original millimetre sheet is restored unchanged when printing. */
export function CertificatePreview({ size, children }: { size: { w: number; h: number }; children: ReactNode }) {
  const container = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [actual, setActual] = useState(false);
  useEffect(() => {
    const node = container.current;
    if (!node) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setWidth(entry.contentRect.width);
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  const pageWidth = size.w * 96 / 25.4;
  const scale = actual ? 1 : Math.min(1, (width || pageWidth) / pageWidth);
  return <section className="certificate-preview min-w-0" aria-label="Certificate preview">
    <div className="no-print mb-3 flex items-center justify-between gap-2">
      <h2 className="font-semibold">Live preview</h2>
      <Button variant="outline" onClick={() => setActual(!actual)} aria-pressed={actual}>
        {actual ? <Maximize /> : <ZoomIn />}{actual ? "Fit to screen" : "Actual size"}
      </Button>
    </div>
    <div ref={container} className="certificate-preview-viewport overflow-x-auto">
      <div className="certificate-pages" style={{ zoom: scale }}>{children}</div>
    </div>
  </section>;
}