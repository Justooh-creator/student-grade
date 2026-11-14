import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { CERT_ELEMENTS, ELEMENT_CATEGORIES, placeElement, updateElement, moveLayer, duplicateElement, type ElementCategory, type PlacedElement } from "@/lib/certElements";

const input = "h-10 w-full rounded-md border border-input bg-background px-3 text-sm";
const checker = { backgroundImage: "repeating-conic-gradient(var(--muted) 0 25%, var(--background) 0 50%)", backgroundSize: "12px 12px" };

export function DesignElementsPanel({ placed, setPlaced, selected, setSelected }: {
  placed: PlacedElement[]; setPlaced: (p: PlacedElement[]) => void; selected: string | undefined; setSelected: (k: string | undefined) => void;
}) {
  const [cat, setCat] = useState<ElementCategory | "all">("all");
  const [q, setQ] = useState("");
  const list = useMemo(() => CERT_ELEMENTS.filter((e) => (cat === "all" || e.category === cat) && e.name.toLowerCase().includes(q.trim().toLowerCase())), [cat, q]);
  const sel = placed.find((p) => p.key === selected);
  const patch = (c: Partial<PlacedElement>) => sel && setPlaced(placed.map((p) => p.key === sel.key ? updateElement(p, c) : p));
  const add = (id: string) => { const el = CERT_ELEMENTS.find((e) => e.id === id)!; const p = placeElement(el); setPlaced([...placed, p]); setSelected(p.key); };
  const slider = (label: string, key: "x" | "y" | "w" | "rotation" | "opacity", min: number, max: number, step = 1) =>
    <label className="text-sm">{label}<input type="range" min={min} max={max} step={step} disabled={sel?.locked} value={sel?.[key] ?? 0} onChange={(e) => patch({ [key]: +e.target.value })} className="w-full" /></label>;

  return <details className="rounded-md border border-border p-3">
    <summary className="cursor-pointer font-semibold">Design elements {placed.length > 0 && `(${placed.length} on certificate)`}</summary>
    <div className="mt-3 space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <input className={input} placeholder="Search elements" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className={input} value={cat} onChange={(e) => setCat(e.target.value as ElementCategory | "all")}>
          <option value="all">All categories</option>
          {ELEMENT_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
        </select>
      </div>
      <div className="grid max-h-64 grid-cols-4 gap-2 overflow-y-auto sm:grid-cols-6">
        {list.map((e) => <button key={e.id} type="button" onClick={() => add(e.id)} title={`Add ${e.name}`} className="flex aspect-square items-center justify-center rounded-md border border-border p-1 hover:border-primary" style={checker}>
          <img src={e.url} alt={e.name} loading="lazy" className="max-h-full max-w-full object-contain" />
        </button>)}
        {list.length === 0 && <p className="col-span-full text-sm text-muted-foreground">No elements match.</p>}
      </div>
      <p className="text-xs text-muted-foreground">Tap an element to add it, drag it to move, and pull its corner squares to resize.</p>
      {sel ? <div className="space-y-2 rounded-md bg-muted/50 p-2">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {slider("Size", "w", 3, 110)}{slider("Rotate", "rotation", 0, 359)}{slider("Opacity", "opacity", 0.05, 1, 0.05)}
          {slider("Left / right", "x", 0, 100, 0.5)}{slider("Up / down", "y", 0, 100, 0.5)}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => setPlaced(moveLayer(placed, sel.key, 1))}>Forward</Button>
          <Button size="sm" variant="outline" onClick={() => setPlaced(moveLayer(placed, sel.key, -1))}>Backward</Button>
          <Button size="sm" variant="outline" onClick={() => patch({ behind: !sel.behind })}>{sel.behind ? "In front of text" : "Behind text"}</Button>
          <Button size="sm" variant="outline" onClick={() => patch({ locked: !sel.locked })}>{sel.locked ? "Unlock" : "Lock"}</Button>
          <Button size="sm" variant="outline" onClick={() => { const d = duplicateElement(sel); setPlaced([...placed, d]); setSelected(d.key); }}>Duplicate</Button>
          <Button size="sm" variant="destructive" onClick={() => { setPlaced(placed.filter((p) => p.key !== sel.key)); setSelected(undefined); }}>Delete</Button>
          <Button size="sm" variant="ghost" onClick={() => setSelected(undefined)}>Done</Button>
        </div>
      </div> : placed.length > 0 && <p className="text-xs text-muted-foreground">Tap an element on the certificate to edit it.</p>}
      {placed.length > 0 && <Button size="sm" variant="outline" onClick={() => { setPlaced([]); setSelected(undefined); }}>Remove all elements</Button>}
    </div>
  </details>;
}
