import { useRef, useState } from "react";
import { FileSpreadsheet, Download, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useCanEditClass } from "@/components/ClassLock";
import { appendLearnerImport, planLearnerImport, type LearnerImportRow, type ImportIssue } from "@/lib/studentImport";
import { getData, updateData, useAppData } from "@/lib/store";
import { getCloud } from "@/lib/cloud";
import { canEditClass } from "@/lib/classAccess";
import { getClassLevel, type ClassId } from "@/lib/ges";

export function LearnerImport({ classId }: { classId: ClassId }) {
  const input = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [parsed, setParsed] = useState<{ rows: LearnerImportRow[]; issues: ImportIssue[] } | null>(null);
  const [sourceClass, setSourceClass] = useState<ClassId>(classId);
  const [filename, setFilename] = useState("");
  const { students } = useAppData();
  const canEdit = useCanEditClass(classId);
  const plan = parsed ? planLearnerImport(parsed.rows, students, sourceClass) : null;

  async function read(file: File) {
    setBusy(true); setParsed(null); setFilename(file.name); setSourceClass(classId); setOpen(true);
    try {
      const { readLearnerFile } = await import("@/lib/readLearnerFile");
      setParsed(await readLearnerFile(file));
    } catch (e) { toast.error(e instanceof Error ? e.message : "Could not read this register."); setOpen(false); }
    finally { setBusy(false); }
  }

  function confirm() {
    if (!parsed || sourceClass !== classId) return;
    try {
      const cloud = getCloud();
      const current = getData();
      const allowed = canEditClass({ inSchool: !!cloud.schoolId, role: cloud.role, userId: cloud.userId,
        assignments: current.school.classAssignments, subjectAssignments: current.school.subjectAssignments, classId });
      let added = 0;
      updateData((data) => {
        const next = appendLearnerImport(data.students, parsed.rows, classId, allowed);
        added = next.length - data.students.length;
        return { ...data, students: next };
      });
      toast.success(`${added} learner${added === 1 ? "" : "s"} imported into ${getClassLevel(classId).name}.`);
      setOpen(false); setParsed(null);
    } catch (e) { toast.error(e instanceof Error ? e.message : "Import failed."); }
  }

  return <>
    <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
      <Button variant="outline" disabled={!canEdit || busy} onClick={() => input.current?.click()}><FileSpreadsheet />Import Excel / CSV</Button>
      <Button asChild variant="ghost"><a href="/downloads/learner-register-template.csv" download="learner-register-template.csv"><Download />CSV template</a></Button>
      <input ref={input} type="file" accept=".csv,.xlsx" aria-label="Import learner register" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; e.target.value = ""; if (file) void read(file); }} />
    </div>
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-h-[85dvh] max-w-2xl overflow-y-auto">
        <DialogHeader><DialogTitle>Import into {getClassLevel(sourceClass).name}</DialogTitle><DialogDescription className="break-all">{filename}</DialogDescription></DialogHeader>
        {busy ? <p role="status">Reading register…</p> : parsed && plan && <>
          <div className="flex flex-wrap gap-3 text-sm font-semibold"><span>{plan.accepted.length} new learners</span><span>{plan.skipped.length} duplicates skipped</span><span>{parsed.issues.length} invalid rows</span><span>{plan.remaining} spaces available</span></div>
          {sourceClass !== classId && <p role="alert" className="text-destructive">The selected class changed. Close this window and choose the register again.</p>}
          {plan.overCapacity && <p role="alert" className="text-destructive">35 learners maximum per class. This register exceeds the {plan.remaining} remaining spaces. Reduce the register and try again; nothing will be imported.</p>}
          <div className="max-h-72 overflow-auto border border-border"><table className="w-full text-left text-sm"><thead className="bg-muted"><tr><th className="p-2">Row</th><th className="p-2">Name</th><th className="p-2">Admission no.</th><th className="p-2">Gender</th></tr></thead><tbody>{plan.accepted.map((r) => <tr key={r.row} className="border-t border-border"><td className="p-2">{r.row}</td><td className="p-2">{r.name}</td><td className="p-2">{r.admissionNo || "—"}</td><td className="p-2">{r.gender || "—"}</td></tr>)}</tbody></table></div>
          {[...parsed.issues, ...plan.skipped].length > 0 && <ul className="max-h-36 overflow-auto text-sm text-muted-foreground">{[...parsed.issues, ...plan.skipped].map((r) => <li key={`${r.row}-${r.message}`}>Row {r.row}: {r.message}</li>)}</ul>}
          <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={confirm} disabled={!canEdit || sourceClass !== classId || plan.overCapacity || !plan.accepted.length}><Upload />Import {plan.accepted.length} learners</Button></div>
        </>}
      </DialogContent>
    </Dialog>
  </>;
}