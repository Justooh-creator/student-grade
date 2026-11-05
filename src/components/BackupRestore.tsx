import { useRef, useState } from "react";
import { toast } from "sonner";
import { getData, updateData } from "@/lib/store";
import { assertSameSchool, buildBackup, mergeRestore, parseBackup } from "@/lib/backup";

export function BackupRestore({ canRestore, schoolId = null }: { canRestore: boolean; schoolId?: string | null }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const btn = "rounded-md bg-primary px-4 py-2 text-sm font-bold text-primary-foreground disabled:opacity-50";

  function exportBackup() {
    const data = getData();
    const blob = new Blob([JSON.stringify(buildBackup(data, new Date(), schoolId), null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const safe = (data.school.name || "school").replace(/[^a-z0-9]+/gi, "-").toLowerCase();
    a.href = url;
    a.download = `edureport-backup-${safe}-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30_000);
    toast.success(`Backup saved (${data.students.length} learners).`);
  }

  async function restore(file: File) {
    setBusy(true);
    try {
      const backup = parseBackup(await file.text());
      assertSameSchool(backup.schoolId, schoolId);
      if (!window.confirm(`Restore ${backup.students.length} learner(s) and school details from this backup? Current text records will be replaced; photos, logos, signatures and stamps on this device are kept.`)) return;
      updateData((cur) => mergeRestore(cur, backup));
      toast.success("Backup restored.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not restore backup.");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <p className="font-bold">💾 Backup & Restore</p>
      <p className="mt-1 text-sm text-muted-foreground">Download a copy of your school details, learners, marks and remarks. Photos, logos, signatures and stamps are not included. The file is not encrypted — keep it safe — it contains learners' personal information.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button onClick={exportBackup} className={btn}>Download backup</button>
        {canRestore && (
          <>
            <button onClick={() => fileRef.current?.click()} disabled={busy} className="rounded-md border border-border px-4 py-2 text-sm font-bold disabled:opacity-50">Restore from backup</button>
            <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void restore(f); }} />
          </>
        )}
      </div>
      {!canRestore && <p className="mt-2 text-xs text-muted-foreground">Only the headteacher can restore a backup for the school.</p>}
    </div>
  );
}
