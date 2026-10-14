import { createContext, createElement, useContext, useEffect, useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useRouter } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";

const AccountContext = createContext<{ user: User | null; ready: boolean }>({ user: null, ready: false });

export function AccountProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const router = useRouter();
  const queryClient = useQueryClient();
  useEffect(() => {
    let active = true;
    let revision = 0;
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      revision++;
      setUser(session?.user ?? null);
      setReady(true);
      if (event === "PASSWORD_RECOVERY") {
        queueMicrotask(() => { void router.navigate({ to: "/reset-password", replace: true }); });
        return;
      }
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      queueMicrotask(() => {
        if (!active) return;
        if (event === "SIGNED_OUT") {
          void queryClient.cancelQueries();
          queryClient.clear();
          void router.navigate({ to: "/auth", replace: true });
        } else {
          void queryClient.invalidateQueries();
        }
        void router.invalidate();
      });
    });
    const initialRevision = revision;
    supabase.auth.getUser().then(({ data }) => {
      if (!active || revision !== initialRevision) return;
      setUser(data.user ?? null);
      setReady(true);
    }).catch(() => { if (active && revision === initialRevision) setReady(true); });
    return () => { active = false; data.subscription.unsubscribe(); };
  }, [router, queryClient]);
  return createElement(AccountContext.Provider, { value: { user, ready } }, children);
}

export function useUser() {
  return useContext(AccountContext);
}
