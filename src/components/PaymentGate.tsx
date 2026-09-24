import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { checkMomoPayment, requestMomoPayment } from "@/lib/momo.functions";

const KEY = "sba-print-unlock-until";
const UNLOCK_MS = 3 * 60 * 60 * 1000;

export function PrintButton() {
  const [until, setUntil] = useState(0);
  const [showPay, setShowPay] = useState(false);
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState<"idle" | "waiting" | "error">("idle");
  const [msg, setMsg] = useState("");
  const [now, setNow] = useState(Date.now());
  const request = useServerFn(requestMomoPayment);
  const check = useServerFn(checkMomoPayment);

  useEffect(() => {
    setUntil(Number(localStorage.getItem(KEY) ?? 0));
    const t = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);

  const unlocked = until > now;

  async function pay() {
    setStatus("waiting");
    setMsg("Approve the GH¢10.00 prompt on your phone…");
    const r = await request({ data: { phone: phone.replace(/\s+/g, "") } }).catch(() => null);
    if (!r || !r.ok) {
      setStatus("error");
      setMsg(r && !r.ok ? r.error : "Enter a valid MTN number, e.g. 024xxxxxxx.");
      return;
    }
    for (let i = 0; i < 40; i++) {
      await new Promise((res) => setTimeout(res, 4000));
      const s = await check({ data: { ref: r.ref } }).catch(() => ({ status: "PENDING" as const }));
      if (s.status === "SUCCESSFUL") {
        const u = Date.now() + UNLOCK_MS;
        localStorage.setItem(KEY, String(u));
        setUntil(u);
        setShowPay(false);
        setStatus("idle");
        setTimeout(() => window.print(), 300);
        return;
      }
      if (s.status === "FAILED") break;
    }
    setStatus("error");
    setMsg("Payment was not completed. Please try again.");
  }

  return (
    <div className="relative">
      <button
        onClick={() => (unlocked ? window.print() : setShowPay((v) => !v))}
        className="h-10 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground hover:opacity-90"
      >
        Print / Save as PDF (A4)
      </button>
      {unlocked && (
        <p className="num mt-1 text-right text-[10px] text-muted-foreground">
          Unlocked · {Math.max(1, Math.ceil((until - now) / 60000))} min left
        </p>
      )}
      {showPay && !unlocked && (
        <div className="absolute right-0 z-20 mt-2 w-72 rounded-xl border border-border bg-card p-4 shadow-xl">
          <p className="text-sm font-semibold">Unlock printing for 3 hours</p>
          <p className="mt-1 text-xs text-muted-foreground">Pay GH¢10.00 with MTN Mobile Money.</p>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Your MTN number (024…)"
            inputMode="tel"
            className="num mt-3 h-10 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-primary"
          />
          <button
            disabled={status === "waiting" || phone.length < 9}
            onClick={pay}
            className="mt-2 h-10 w-full rounded-md bg-accent text-sm font-semibold text-accent-foreground disabled:opacity-50"
          >
            {status === "waiting" ? "Waiting for approval…" : "Pay GH¢10.00 with MoMo"}
          </button>
          {msg && <p className={status === "error" ? "mt-2 text-xs text-destructive" : "mt-2 text-xs text-muted-foreground"}>{msg}</p>}
        </div>
      )}
    </div>
  );
}
