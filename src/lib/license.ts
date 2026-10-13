import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface LicenseState {
  loading: boolean;
  canPrint: boolean;
  status: "unpaid" | "active" | "expired";
  source: "none" | "school" | "individual" | "developer";
  expiresAt?: string | null;
}

const SIGNED_OUT: LicenseState = { loading: false, canPrint: false, status: "unpaid", source: "none" };

/** Read the signed-in user's print license from the cloud (school, individual, or developer). */
export function useLicense(userId: string | undefined) {
  const [lic, setLic] = useState<LicenseState>({ ...SIGNED_OUT, loading: true });

  const refresh = useCallback(async () => {
    if (!userId) { setLic(SIGNED_OUT); return; }
    const { data, error } = await supabase.rpc("get_my_license");
    if (error || !data) { setLic({ ...SIGNED_OUT }); return; }
    const d = data as Record<string, unknown>;
    setLic({
      loading: false,
      canPrint: d['can_print'] === true,
      status: (d['status'] as LicenseState["status"]) ?? "unpaid",
      source: (d['source'] as LicenseState["source"]) ?? "none",
      expiresAt: (d['expires_at'] as string) ?? null,
    });
  }, [userId]);

  useEffect(() => { refresh(); }, [refresh]);

  return { ...lic, refresh };
}

/** Redeem a gift/activation/developer code. Returns the new license state or throws. */
export async function redeemCode(code: string): Promise<LicenseState> {
  const { data, error } = await supabase.rpc("redeem_code", { _code: code });
  if (error) throw new Error(error.message);
  const d = data as Record<string, unknown>;
  return {
    loading: false,
    canPrint: d['can_print'] === true,
    status: (d['status'] as LicenseState["status"]) ?? "unpaid",
    source: (d['source'] as LicenseState["source"]) ?? "none",
    expiresAt: (d['expires_at'] as string) ?? null,
  };
}

/** Record the first save/print of this term (starts the 15-day window; reprints never reset it). */
export async function recordPrint(termKey: string): Promise<{ blocked: boolean; lockedTerm?: string | undefined }> {
  const { data, error } = await supabase.rpc("record_print", { _term_key: termKey });
  if (error) throw new Error(error.message);
  const d = (data ?? {}) as Record<string, unknown>;
  return { blocked: d["term_blocked"] === true, lockedTerm: d["locked_term"] as string | undefined };
}


export function licenseLabel(lic: LicenseState): string {
  if (lic.source === "developer") return "Developer access — permanent";
  if (lic.status === "active") {
    const until = lic.expiresAt ? ` until ${new Date(lic.expiresAt).toLocaleDateString()}` : "";
    return lic.source === "school" ? `School license active${until}` : `Your license active${until}`;
  }
  if (lic.status === "expired") return "License expired — printing is locked";
  return "No active license — printing is locked";
}
