import { useEffect } from "react";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { canOpenApp } from "@/lib/accountAccess";
import { useCloud } from "@/lib/cloud";
import { autoSubscribeNotifications } from "@/lib/pushNotifications";

function AuthenticatedShell() {
  const cloud = useCloud();
  useEffect(() => {
    if (!cloud.userId) return;
    void autoSubscribeNotifications({ userId: cloud.userId, schoolId: cloud.schoolId });
  }, [cloud.userId, cloud.schoolId]);
  return <Outlet />;
}

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  head: () => ({ meta: [{ name: "robots", content: "noindex, nofollow" }] }),
  beforeLoad: async ({ location }) => {
    if (location.hash.includes("type=recovery")) {
      throw redirect({ to: "/reset-password", hash: location.hash, replace: true });
    }
    // Local session read keeps app launch instant; the server still verifies every data request.
    const { data, error } = await supabase.auth.getSession();
    const user = data.session?.user ?? null;
    if (!canOpenApp(user, error)) throw redirect({ to: "/auth", replace: true });
    return { user };
  },
  pendingComponent: () => <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground" role="status">Opening EduReport…</div>,
  component: AuthenticatedShell,
});