import { useRef, useState } from "react";
import { FileSpreadsheet, Download, Upload, Camera, ImageUp, Trash2, Plus } from "lucide-react";
import { CameraButton } from "@/components/CameraCapture";
import { scanRegisterPhoto } from "@/lib/registerScan.functions";
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
    setEditable(false); setBusy(true); setParsed(null); setFilename(file.name); setSourceClass(classId); setOpen(true);
    try {
      const { readLearnerFile } = await import("@/lib/readLearnerFile");
      setParsed(await readLearnerFile(file));
    } catch (e) { toast.error(e instanceof Error ? e.message : "Could not read this register."); setOpen(false); }
    finally { setBusy(false); }
  }

  async function readPhoto(file: File) {
    setBusy(true); setParsed(null); setFilename("Register photo"); setSourceClass(classId); setOpen(true);
    try {
      const image = await shrink(file);
      const { learners } = await scanRegisterPhoto({ data: { image } });
      if (!learners.length) throw new Error("No learner names were found. Try a clearer photo.");
      setParsed({ rows: learners.map((l, i) => ({ row: i + 1, ...l })), issues: [] });
      setEditable(true);
    } catch (e) { toast.error(e instanceof Error ? e.message : "Could not read this photo."); setOpen(false); }
    finally { setBusy(false); }
  }
  const [editable, setEditable] = useState(false);
  const photoInput = useRef<HTMLInputElement>(null);
  function editRow(i: number, patch: Partial<LearnerImportRow>) {
    setParsed((p) => p && { ...p, rows: p.rows.map((r, j) => j === i ? { ...r, ...patch } : r) });
  }
  function removeRow(i: number) { setParsed((p) => p && { ...p, rows: p.rows.filter((_, j) => j !== i) }); }
  function addRow() { setParsed((p) => p && { ...p, rows: [...p.rows, { row: p.rows.length + 1, name: "", admissionNo: "", gender: "" }] }); }

  function confirm() {
    if (!parsed || sourceClass !== classId) return;
    parsed.rows = parsed.rows.map((r) => ({ ...r, name: r.name.trim().replace(/\s+/g, " ") })).filter((r) => r.name);
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
    <div className="mt-4 border-t border-border pt-4">
      <div className="grid grid-cols-3 gap-1.5 sm:flex sm:flex-wrap sm:gap-2">
        <Button variant="outline" className="px-2 text-xs sm:px-4 sm:text-sm" disabled={!canEdit || busy} onClick={() => input.current?.click()}><FileSpreadsheet /><span className="sm:hidden">Excel / CSV</span><span className="hidden sm:inline">Import Excel / CSV</span></Button>
        <CameraButton title="Snap class register" onFile={(f) => { if (canEdit) void readPhoto(f); }}>
          <span className={`inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-md border border-input px-2 text-xs font-medium sm:w-auto sm:gap-2 sm:px-3 sm:text-sm ${!canEdit || busy ? "pointer-events-none opacity-50" : ""}`}><Camera className="size-4" /><span className="sm:hidden">Snap</span><span className="hidden sm:inline">Snap register</span></span>
        </CameraButton>
        <Button variant="outline" className="px-2 text-xs sm:px-4 sm:text-sm" disabled={!canEdit || busy} onClick={() => photoInput.current?.click()}><ImageUp /><span className="sm:hidden">Upload</span><span className="hidden sm:inline">Register photo</span></Button>
      </div>
      <input ref={photoInput} type="file" accept="image/*" aria-label="Register photo" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; e.target.value = ""; if (file) void readPhoto(file); }} />
      <Button asChild variant="ghost" className="mt-1.5"><a href="/downloads/learner-register-template.csv" download="learner-register-template.csv"><Download />CSV template</a></Button>
      <input ref={input} type="file" accept=".csv,.xlsx" aria-label="Import learner register" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; e.target.value = ""; if (file) void read(file); }} />
    </div>
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-h-[85dvh] max-w-2xl overflow-y-auto">
        <DialogHeader><DialogTitle>Import into {getClassLevel(sourceClass).name}</DialogTitle><DialogDescription className="break-all">{filename}</DialogDescription></DialogHeader>
        {busy ? <p role="status">Reading register… this can take up to a minute.</p> : parsed && plan && <>
          <div className="flex flex-wrap gap-3 text-sm font-semibold"><span>{plan.accepted.length} new learners</span><span>{plan.skipped.length} duplicates skipped</span><span>{parsed.issues.length} invalid rows</span><span>{plan.remaining} spaces available</span></div>
          {sourceClass !== classId && <p role="alert" className="text-destructive">The selected class changed. Close this window and choose the register again.</p>}
          {plan.overCapacity && <p role="alert" className="text-destructive">35 learners maximum per class. This register exceeds the {plan.remaining} remaining spaces. Reduce the register and try again; nothing will be imported.</p>}
          {editable ? <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Check each name and fix any spelling before adding.</p>
            <div className="max-h-80 space-y-2 overflow-auto">{parsed.rows.map((r, i) => <div key={i} className="grid grid-cols-[1fr_auto] gap-1.5 rounded-md border border-border p-2 sm:grid-cols-[2fr_1fr_7rem_auto]">
              <input aria-label={`Learner ${i + 1} name`} value={r.name} onChange={(e) => editRow(i, { name: e.target.value })} className="col-span-1 rounded border border-input bg-background px-2" placeholder="Full name" />
              <button type="button" aria-label="Remove" onClick={() => removeRow(i)} className="row-span-1 px-2 text-destructive sm:order-last"><Trash2 className="size-4" /></button>
              <input aria-label="Admission no." value={r.admissionNo} onChange={(e) => editRow(i, { admissionNo: e.target.value })} className="rounded border border-input bg-background px-2" placeholder="Adm. no." />
              <select aria-label="Gender" value={r.gender} onChange={(e) => editRow(i, { gender: e.target.value })} className="rounded border border-input bg-background px-2"><option value="">Gender</option><option>Male</option><option>Female</option></select>
            </div>)}</div>
            <Button variant="ghost" size="sm" onClick={addRow}><Plus />Add a name</Button>
          </div> : <div className="max-h-72 overflow-auto border border-border"><table className="w-full text-left text-sm"><thead className="bg-muted"><tr><th className="p-2">Row</th><th className="p-2">Name</th><th className="p-2">Admission no.</th><th className="p-2">Gender</th></tr></thead><tbody>{plan.accepted.map((r) => <tr key={r.row} className="border-t border-border"><td className="p-2">{r.row}</td><td className="p-2">{r.name}</td><td className="p-2">{r.admissionNo || "—"}</td><td className="p-2">{r.gender || "—"}</td></tr>)}</tbody></table></div>}
          {[...parsed.issues, ...plan.skipped].length > 0 && <ul className="max-h-36 overflow-auto text-sm text-muted-foreground">{[...parsed.issues, ...plan.skipped].map((r) => <li key={`${r.row}-${r.message}`}>Row {r.row}: {r.message}</li>)}</ul>}
          <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={confirm} disabled={!canEdit || sourceClass !== classId || plan.overCapacity || !plan.accepted.length}><Upload />Import {plan.accepted.length} learners</Button></div>
        </>}
      </DialogContent>
    </Dialog>
  </>;
}

async function shrink(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error("This photo could not be opened.")); i.src = url; });
    const scale = Math.min(1, 2000 / Math.max(img.width, img.height));
    const c = document.createElement("canvas");
    c.width = Math.round(img.width * scale); c.height = Math.round(img.height * scale);
    c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL("image/jpeg", 0.85);
  } finally { URL.revokeObjectURL(url); }
}
