import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getRouteApi } from "@tanstack/react-router";
import { Users } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const route = getRouteApi("/_authenticated/settings");
const response = z.object({ total: z.number(), this_week: z.number(), matched: z.number(), rows: z.array(z.object({ id: z.string(), display_name: z.string(), email: z.string(), created_at: z.string(), verified: z.boolean(), role: z.string(), school_name: z.string() })) });

export function DevRegistrationsPanel() {
  const { user } = useUser();
  const [developerId, setDeveloperId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const { registrationSearch, registrationPage } = route.useSearch();
  const navigate = route.useNavigate();
  useEffect(() => {
    let alive = true;
    setDeveloperId(null);
    if (user) void supabase.rpc("is_developer").then(({ data }) => { if (alive && data) setDeveloperId(user.id); });
    return () => { alive = false; };
  }, [user?.id]);
  const isDev = !!user && developerId === user.id;
  const { data, isFetching, error, refetch } = useQuery({
    queryKey: ["developer-registrations", user?.id, registrationSearch, registrationPage],
    enabled: isDev,
    queryFn: async () => {
      const result = await supabase.rpc("dev_registration_list", { _search: registrationSearch, _offset: registrationPage * 8 });
      if (result.error) throw new Error("Could not load registrations. Try again.");
      return response.parse(result.data);
    },
  });
  if (!isDev) return null;
  const pages = Math.max(1, Math.ceil((data?.matched ?? 0) / 8));
  return <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
    <Button variant="ghost" className="h-auto w-full justify-between whitespace-normal p-0 text-left" aria-expanded={open} aria-controls="developer-registrations" onClick={() => setOpen(!open)}>
      <span className="min-w-0"><span className="flex items-center gap-2 font-display font-bold text-primary"><Users className="size-5 shrink-0" />Developer: New Registrations</span><span className="mt-1 block text-xs text-muted-foreground">{data ? `${data.total} total · ${data.this_week} this week` : isFetching ? "Loading…" : "Tap to view accounts"}</span></span>
      <span className="ml-2 shrink-0 text-xs">{open ? "Hide" : "Show"}</span>
    </Button>
    {open && <div id="developer-registrations" className="mt-3 space-y-3">
      <Input aria-label="Search registrations" placeholder="Find teacher, email or school…" value={registrationSearch} maxLength={100} onChange={(event) => void navigate({ search: (prev) => ({ ...prev, registrationSearch: event.target.value, registrationPage: 0 }), replace: true })} />
      <div aria-busy={isFetching} className="max-h-80 space-y-2 overflow-y-auto rounded-md border border-border p-2">
        {error ? <p className="text-sm text-destructive">Could not load registrations.</p> : isFetching ? <p role="status" className="text-sm text-muted-foreground">Loading registrations…</p> : !data?.rows.length ? <p className="text-sm text-muted-foreground">No matching registrations.</p> : data.rows.map((row) => <article key={row.id} className="rounded-md bg-muted/40 p-3 text-sm">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2"><p className="break-words font-semibold">{row.display_name || "Name not provided"}</p><span className="shrink-0 text-xs text-muted-foreground">{new Date(row.created_at).toLocaleDateString("en-GB")}</span></div>
          <p className="break-all text-xs text-muted-foreground">{row.email}</p>
          <p className="mt-1 break-words text-xs">{row.school_name || "No school joined"} · {row.role === "headteacher" ? "Headteacher" : row.role === "teacher" ? "Teacher" : "Individual"}</p>
          <p className={`mt-1 text-xs font-semibold ${row.verified ? "text-primary" : "text-muted-foreground"}`}>{row.verified ? "Email verified" : "Email not yet verified"}</p>
        </article>)}
      </div>
      <div className="flex items-center justify-between gap-2">
        <Button size="sm" variant="outline" disabled={!registrationPage || isFetching} onClick={() => void navigate({ search: (prev) => ({ ...prev, registrationPage: Math.max(0, prev.registrationPage - 1) }) })}>Previous</Button>
        <span className="text-xs text-muted-foreground">Page {registrationPage + 1} of {pages}</span>
        <Button size="sm" variant="outline" disabled={registrationPage + 1 >= pages || isFetching} onClick={() => void navigate({ search: (prev) => ({ ...prev, registrationPage: prev.registrationPage + 1 }) })}>Next</Button>
      </div>
      <Button size="sm" variant="ghost" disabled={isFetching} onClick={() => void refetch()}>Refresh registrations</Button>
    </div>}
  </section>;
}
