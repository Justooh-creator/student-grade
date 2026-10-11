import { useState } from "react";
import { toast } from "sonner";
import { licenseLabel, redeemCode, type LicenseState } from "@/lib/license";
import { PAYSTACK_PLANS, PAYSTACK_TEST_PLAN, payWithPaystack } from "@/lib/paystack";
import { verifyPaystackPayment } from "@/lib/paystack.functions";
import { useUser } from "@/lib/auth";

/** License status + payment + gift/activation code entry. Shown on the School Cloud page. */
export function LicenseCard({ lic, onActivated }: { lic: LicenseState; onActivated: (l: LicenseState) => void }) {
  const { user } = useUser();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [planId, setPlanId] = useState(PAYSTACK_PLANS[0]!.id);
  const [paying, setPaying] = useState(false);

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

  async function pay() {
    if (!user?.email) {
      toast.error("Sign in first so the payment can be linked to your account.");
      return;
    }
    const plan = PAYSTACK_PLANS.find((p) => p.id === planId)!;
    setPaying(true);
    try {
      await payWithPaystack({
        email: user.email,
        plan,
        onSuccess: async (reference) => {
          try {
            await verifyPaystackPayment({ data: { reference, planId: plan.id } });
            toast.success("Payment confirmed! Your license is now active.");
            onActivated({ ...lic });
          } catch (e) {
            toast.error((e as Error).message);
          }
        },
        onClose: () => setPaying(false),
      });
    } catch (e) {
      toast.error((e as Error).message);
      setPaying(false);
    }
  }

  async function testPay() {
    if (!user?.email) return;
    setPaying(true);
    try {
      await payWithPaystack({
        email: user.email,
        plan: PAYSTACK_TEST_PLAN,
        onSuccess: async (reference) => {
          try {
            await verifyPaystackPayment({ data: { reference, planId: PAYSTACK_TEST_PLAN.id } });
            toast.success("Test payment verified ✓ — MoMo and confirmation are working.");
          } catch (e) {
            toast.error((e as Error).message);
          }
          setPaying(false);
        },
        onClose: () => setPaying(false),
      });
    } catch (e) {
      toast.error((e as Error).message);
      setPaying(false);
    }
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

      <div className="mt-4 rounded-md border border-border p-3">
        <p className="text-sm font-bold">Pay MTN Mobile Money</p>
        <label className="mt-2 block text-sm font-bold">Choose a plan
          <select
            value={planId}
            onChange={(e) => setPlanId(e.target.value)}
            className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            {PAYSTACK_PLANS.map((p) => (
              <option key={p.id} value={p.id}>{p.label} — GH₵{p.amount}</option>
            ))}
          </select>
        </label>
        <button
          onClick={pay}
          disabled={paying || lic.canPrint}
          className="mt-3 w-full rounded-md bg-primary px-4 py-2 text-sm font-bold text-primary-foreground disabled:opacity-50"
        >
          {paying ? "Opening payment…" : lic.canPrint ? "License active" : `Pay GH₵${PAYSTACK_PLANS.find((p) => p.id === planId)!.amount}`}
        </button>
        {lic.source === "developer" && (
          <button
            onClick={testPay}
            disabled={paying}
            className="mt-2 w-full rounded-md border border-border px-4 py-2 text-sm font-bold disabled:opacity-50"
          >
            🧪 Developer test: pay GH₵1 (checks MoMo prompt, no license)
          </button>
        )}
      </div>

      <label className="mt-4 block text-sm font-bold">Gift / activation code
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
