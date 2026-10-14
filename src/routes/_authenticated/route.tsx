import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { canOpenApp } from "@/lib/accountAccess";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    if (location.hash.includes("type=recovery")) {
      throw redirect({ to: "/reset-password", hash: location.hash, replace: true });
    }
    const { data, error } = await supabase.auth.getUser();
    if (!canOpenApp(data.user, error)) throw redirect({ to: "/auth", replace: true });
    return { user: data.user };
  },
  pendingComponent: () => <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground" role="status">Opening EduReport…</div>,
  component: Outlet,
});