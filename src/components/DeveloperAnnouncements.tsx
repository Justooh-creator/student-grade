import { useCallback, useEffect, useState } from "react";
import { Copy, Megaphone, MessageCircle, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/lib/auth";
import { AUDIENCES, NOTICE_KINDS, announcementError, whatsappPhone, type Announcement } from "@/lib/announcements";
import { sendAnnouncementPush } from "@/lib/push.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";

const CHANGE = "edureport-announcements-changed";

export function AnnouncementBanner() {
  const { user } = useUser();
  const [rows, setRows] = useState<Announcement[]>([]);
  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  const [dismissing, setDismissing] = useState(false);
  useEffect(() => {
    setRows([]);
    setLoadedFor(null);
    if (!user) return;
    let alive = true;
    const load = async () => {
      const { data, error } = await supabase.rpc("list_my_announcements");
      if (alive && !error) { setRows(data ?? []); setLoadedFor(user.id); }
    };
    const visible = () => { if (document.visibilityState === "visible") void load(); };
    void load();
    window.addEventListener(CHANGE, load);
    window.addEventListener("online", load);
    document.addEventListener("visibilitychange", visible);
    return () => { alive = false; window.removeEventListener(CHANGE, load); window.removeEventListener("online", load); document.removeEventListener("visibilitychange", visible); };
  }, [user?.id]);

  const dismiss = async (row: Announcement) => {
    if (!user || dismissing) return;
    setDismissing(true);
    const { error } = await supabase.from("announcement_dismissals").upsert({ user_id: user.id, announcement_id: row.id, revision: row.revision });
    setDismissing(false);
    if (error) { toast.error("Could not dismiss this announcement. Try again when connected."); return; }
    setRows((current) => current.filter((a) => a.id !== row.id));
  };

  const row = loadedFor === user?.id ? rows[0] : undefined;
  if (!row) return null;
  return <Dialog key={`${row.id}:${row.revision}`} open onOpenChange={(open) => { if (!open) void dismiss(row); }}>
    <DialogContent className="max-h-[85dvh] w-[calc(100%-2rem)] max-w-md gap-0 overflow-y-auto rounded-2xl border-border bg-card p-0 text-center [&>button]:text-primary-foreground" onInteractOutside={(event) => event.preventDefault()}>
      <div className="bg-linear-to-br from-primary to-primary/85 px-10 py-6 text-primary-foreground">
        <DialogTitle className="break-words font-display text-xl font-bold">{row.title}</DialogTitle>
      </div>
      <div className="space-y-5 p-6">
        <div aria-hidden="true" className="mx-auto flex size-20 items-center justify-center rounded-full bg-primary/10 text-primary"><Megaphone className="size-10" /></div>
        <DialogDescription className="whitespace-pre-wrap break-words text-base font-semibold leading-relaxed text-foreground">{row.body}</DialogDescription>
        {row.whatsapp_phone && <Button asChild variant="outline" className="w-full"><a href={`https://wa.me/${row.whatsapp_phone}?text=${encodeURIComponent(row.title)}`} target="_blank" rel="noreferrer"><MessageCircle className="size-4" />Chat on WhatsApp</a></Button>}
        <Button disabled={dismissing} className="w-full" onClick={() => void dismiss(row)}>{dismissing ? "Saving…" : "Got it"}</Button>
      </div>
    </DialogContent>
  </Dialog>;
}

export function DevAnnouncementPanel() {
  const [isDev, setIsDev] = useState(false);
  const [rows, setRows] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState("all");
  const [kind, setKind] = useState("update");
  const [phone, setPhone] = useState("");
  const pushNotice = useServerFn(sendAnnouncementPush);
  const load = useCallback(async () => {
    const { data, error } = await supabase.from("developer_announcements").select("*").order("created_at", { ascending: false });
    setLoading(false);
    if (error) { toast.error("Could not load announcements."); return; }
    setRows(data ?? []);
  }, []);
  useEffect(() => {
    let alive = true;
    void supabase.rpc("is_developer").then(({ data }) => { if (alive && data) { setIsDev(true); void load(); } });
    return () => { alive = false; };
  }, [load]);
  const reset = () => { setEditing(null); setTitle(""); setBody(""); setAudience("all"); setKind("update"); setPhone(""); };
  const changed = () => { void load(); window.dispatchEvent(new Event(CHANGE)); };
  const save = async (active: boolean) => {
    const invalid = announcementError(title, body, phone);
    if (invalid) { toast.error(invalid); return; }
    setBusy(true);
    const payload = { title: title.trim(), body: body.trim(), audience, kind, whatsapp_phone: whatsappPhone(phone), active };
    const { error } = editing ? await supabase.from("developer_announcements").update(payload).eq("id", editing) : await supabase.from("developer_announcements").insert(payload);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    if (active) {
      void pushNotice({ data: { title: payload.title, body: payload.body, audience: payload.audience, kind: payload.kind } }).catch(() => {});
    }
    toast.success(active ? "Announcement published." : "Draft saved."); reset(); changed();
  };
  const toggle = async (row: Announcement) => {
    setBusy(true);
    const { error } = await supabase.from("developer_announcements").update({ active: !row.active }).eq("id", row.id);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    changed();
  };
  const copyText = async (row: Announcement) => {
    const text = `${row.title}\n\n${row.body}`;
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Announcement copied.");
    } catch {
      toast.error("Could not copy text. Please copy it manually.");
    }
  };
  const remove = async (row: Announcement) => {
    if (!window.confirm(`Permanently delete “${row.title}”? This removes it from everyone's in-app notices. Phone alerts already delivered cannot be recalled.`)) return;
    setBusy(true);
    const { error, data } = await supabase.from("developer_announcements").delete().eq("id", row.id).select("id");
    setBusy(false);
    if (error || !data?.length) { toast.error("Could not delete this announcement. Try again."); return; }
    if (editing === row.id) reset();
    toast.success("Announcement deleted.");
    changed();
  };
  if (!isDev) return null;
  return <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
    <h2 className="mb-3 flex items-center gap-2 font-display text-base font-bold text-primary"><Megaphone className="size-5" />Developer Announcer</h2>
    <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); void save(true); }}>
      <label className="block text-sm font-semibold">Headline<Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={160} required /></label>
      <label className="block text-sm font-semibold">Message<Textarea value={body} onChange={(e) => setBody(e.target.value)} maxLength={4000} rows={4} required /></label>
      <div className="grid gap-3 sm:grid-cols-2"><div><label id="announcement-audience-label" className="text-sm font-semibold">Audience</label><Select value={audience} onValueChange={setAudience}><SelectTrigger aria-labelledby="announcement-audience-label" className="w-full"><SelectValue /></SelectTrigger><SelectContent>{AUDIENCES.map((a) => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}</SelectContent></Select></div>
        <div><label id="announcement-kind-label" className="text-sm font-semibold">Notice type</label><Select value={kind} onValueChange={setKind}><SelectTrigger aria-labelledby="announcement-kind-label" className="w-full"><SelectValue /></SelectTrigger><SelectContent>{NOTICE_KINDS.map((a) => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}</SelectContent></Select></div></div>
      <label className="block text-sm font-semibold">WhatsApp number (optional)<Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} /></label>
      <div className="flex flex-wrap gap-2"><Button type="submit" disabled={busy}>{busy ? "Saving…" : editing ? "Publish changes" : "Publish"}</Button><Button type="button" variant="outline" disabled={busy} onClick={() => void save(false)}>Save draft</Button>{editing && <Button type="button" variant="ghost" onClick={reset}>Cancel edit</Button>}</div>
    </form>
    <div className="mt-5 space-y-3 border-t border-border pt-3"><h3 className="text-sm font-bold">Announcements</h3>{loading ? <p className="text-sm text-muted-foreground">Loading…</p> : !rows.length ? <p className="text-sm text-muted-foreground">No announcements yet.</p> : rows.map((row) => <article key={row.id} className="border-b border-border pb-3">
      <p className="break-words text-sm font-bold">{row.title}</p><p className="text-xs text-muted-foreground">{row.active ? "Published" : "Draft / Inactive"} · {AUDIENCES.find((a) => a.value === row.audience)?.label} · {NOTICE_KINDS.find((a) => a.value === row.kind)?.label}</p>
      <p className="mt-1 whitespace-pre-wrap break-words text-sm">{row.body}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        <Button size="sm" variant="outline" disabled={busy} onClick={() => { setEditing(row.id); setTitle(row.title); setBody(row.body); setAudience(row.audience); setKind(row.kind); setPhone(row.whatsapp_phone); }}><Pencil className="size-3" />Edit</Button>
        <Button size="sm" variant="outline" disabled={busy} onClick={() => void toggle(row)}>{row.active ? "Deactivate" : "Publish"}</Button>
        <Button size="sm" variant="destructive" disabled={busy} onClick={() => void remove(row)}><Trash2 className="size-3" />Delete</Button>
        <Button size="sm" variant="outline" onClick={() => void copyText(row)}><Copy className="size-3" />Copy Text</Button>
        <Button asChild size="sm" variant="outline"><a href={`https://wa.me/?text=${encodeURIComponent(`${row.title}\n\n${row.body}`)}`} target="_blank" rel="noreferrer"><MessageCircle className="size-3" />Share via WhatsApp</a></Button>
      </div>
    </article>)}</div>
  </section>;
}