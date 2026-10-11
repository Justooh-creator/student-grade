import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { normalizeGhanaPhone, openSms, openWhatsApp, smsLink, whatsAppLink } from "@/lib/whatsapp";
import { useAppData } from "@/lib/store";
import { useUser } from "@/lib/auth";
import { useLicense } from "@/lib/license";

/** Free WhatsApp sharing of a learner's terminal summary, sent from the teacher's own WhatsApp. Requires an active license. */
export function ClassWhatsAppShare({ classId, className }: { classId: string; className: string }) {
  const { school, students } = useAppData();
  const { user, ready: authReady } = useUser();
  const lic = useLicense(user?.id);
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  const list = students.filter((s) => s.classId === classId);
  const ready = list.filter((s) => normalizeGhanaPhone(s.parentPhone));
  const locked = authReady && !lic.loading && !lic.canPrint;

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function toggle() {
    if (locked) {
      toast.error("WhatsApp sharing needs an active license. Tap to activate.");
      navigate({ to: "/school-cloud" });
      return;
    }
    if (!ready.length) {
      toast.error(`Add a parent phone in Student Details before sharing ${className} on WhatsApp.`);
      return;
    }
    setOpen((v) => !v);
  }

  const btn = "flex h-9 cursor-pointer items-center justify-center rounded-md border border-border px-4 text-xs font-bold hover:bg-muted";

  return (
    <div ref={boxRef} className="relative">
      <button onClick={toggle} aria-expanded={open} title={locked ? "WhatsApp sharing needs an active license. Tap to activate." : undefined} className={`${btn} ${locked || !ready.length ? "text-muted-foreground" : "text-primary"}`}>
        {locked ? "🔒 WhatsApp" : "WhatsApp"}
      </button>
      {open && (
        <div className="absolute right-0 z-30 mt-2 max-h-72 w-64 overflow-y-auto rounded-lg border border-border bg-card p-2 shadow-lg">
          <p className="px-1 pb-1 text-[13px] font-bold uppercase tracking-[0.12em] text-foreground">{className} · send summary</p>
          <p className="px-1 pb-1 text-[12px] text-muted-foreground">Number not on WhatsApp? Use SMS — same message.</p>
          {ready.map((s) => {
            const href = whatsAppLink(s, students, school);
            const sms = smsLink(s, students, school);
            return href ? (
              <div key={s.id} className="flex items-center gap-1 rounded-md px-2 py-1.5 hover:bg-muted">
                <a
                  href={href}
                  onClick={(e) => {
                    e.preventDefault();
                    setOpen(false);
                    openWhatsApp(href);
                  }}
                  className="min-w-0 flex-1 text-xs font-bold"
                >
                  {s.name}
                  <span className="num block text-[12px] font-normal text-muted-foreground">{s.parentPhone}</span>
                </a>
                {sms && (
                  <button
                    onClick={() => {
                      setOpen(false);
                      openSms(sms);
                    }}
                    title="Send the same message as a text message"
                    className="rounded border border-border px-2 py-1 text-[12px] font-bold hover:bg-background"
                  >
                    SMS
                  </button>
                )}
              </div>
            ) : null;
          })}
        </div>
      )}
    </div>
  );
}
