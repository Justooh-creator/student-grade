import { useEffect, useRef, useState, type ReactNode } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

/**
 * Opens the phone's live camera inside the app (no gallery/file chooser).
 * Falls back to a capture-enabled file input when the browser has no camera API.
 */
export function CameraButton({ children, className, onFile, title = "Take photo" }: {
  children: ReactNode; className?: string; onFile: (f: File) => void | Promise<void>; title?: string;
}) {
  const [open, setOpen] = useState(false);
  const fallback = useRef<HTMLInputElement>(null);

  function start() {
    if (typeof navigator !== "undefined" && typeof navigator.mediaDevices?.getUserMedia === "function") setOpen(true);
    else fallback.current?.click();
  }

  return (
    <>
      <button type="button" onClick={start} className={className}>{children}</button>
      <input ref={fallback} type="file" accept="image/*" capture="environment" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) void onFile(f); }} />
      {open && <CameraDialog title={title} onClose={() => setOpen(false)} onFallback={() => { setOpen(false); fallback.current?.click(); }}
        onFile={(f) => { setOpen(false); void onFile(f); }} />}
    </>
  );
}

function CameraDialog({ title, onClose, onFile, onFallback }: { title: string; onClose: () => void; onFile: (f: File) => void; onFallback: () => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const [facing, setFacing] = useState<"environment" | "user">("environment");
  const [shot, setShot] = useState<Blob | null>(null);
  const [preview, setPreview] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setError("");
    navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: facing }, width: { ideal: 1280 } }, audio: false })
      .then((s) => {
        if (cancelled) { s.getTracks().forEach((t) => t.stop()); return; }
        stream.current = s;
        if (video.current) { video.current.srcObject = s; void video.current.play().catch(() => {}); }
      })
      .catch(() => setError("Camera could not start. Allow camera access, or use the phone camera instead."));
    return () => { cancelled = true; stream.current?.getTracks().forEach((t) => t.stop()); stream.current = null; };
  }, [facing]);

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  function snap() {
    const v = video.current;
    if (!v || !v.videoWidth) return;
    const c = document.createElement("canvas");
    c.width = v.videoWidth; c.height = v.videoHeight;
    const ctx = c.getContext("2d")!;
    if (facing === "user") { ctx.translate(c.width, 0); ctx.scale(-1, 1); }
    ctx.drawImage(v, 0, 0);
    c.toBlob((b) => { if (b) { setShot(b); setPreview(URL.createObjectURL(b)); } }, "image/jpeg", 0.92);
  }

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{title}</DialogTitle><DialogDescription>Hold the phone steady, then tap Snap.</DialogDescription></DialogHeader>
        <div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg bg-muted">
          {error ? <p className="p-4 text-sm text-destructive">{error}</p> : preview
            ? <img src={preview} alt="Captured" className="h-full w-full object-cover" />
            : <video ref={video} playsInline muted className={`h-full w-full object-cover ${facing === "user" ? "-scale-x-100" : ""}`} />}
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          {error ? <Button onClick={onFallback}>Use phone camera</Button> : shot ? (
            <>
              <Button variant="outline" onClick={() => { setShot(null); setPreview(""); }}>Retake</Button>
              <Button onClick={() => onFile(new File([shot], `photo-${Date.now()}.jpg`, { type: "image/jpeg" }))}>Use photo</Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setFacing((f) => (f === "user" ? "environment" : "user"))}>🔄 Flip</Button>
              <Button onClick={snap}>📸 Snap</Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
