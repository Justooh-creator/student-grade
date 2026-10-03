import { toast } from "sonner";
import { MAX_STUDENTS_PER_CLASS } from "@/lib/ges";
import { useAppData, type Student } from "@/lib/store";

/** Offline Import/Export of one class's records as a JSON file (share sheet on phones). */
export function ClassTransfer({ classId, className }: { classId: string; className: string }) {
  const { students, importStudents } = useAppData();
  const list = students.filter((s) => s.classId === classId);

  async function exportFile() {
    const json = JSON.stringify({ type: "sba-class", classId, students: list }, null, 2);
    const name = `${className.replace(/\s+/g, "-")}-records.json`;
    const file = new File([json], name, { type: "application/json" });
    const w = window as unknown as Record<string, { shareText?: (t: string, c: string) => void } | undefined>;
    const bridge = w.AndroidBridge?.shareText ? w.AndroidBridge : w.AndroidPrint?.shareText ? w.AndroidPrint : undefined;
    if (bridge?.shareText) {
      bridge.shareText(`${className} SBA records`, json);
      return;
    }
    const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
    try {
      if (nav.share && nav.canShare?.({ files: [file] })) {
        await nav.share({ files: [file], title: name, text: `${className} SBA records` });
        return;
      }
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
    }
    const a = document.createElement("a");
    a.href = URL.createObjectURL(file);
    a.download = name;
    a.click();
    try { await navigator.clipboard.writeText(json); toast.success("File saved. The records were also copied — you can paste them into WhatsApp."); }
    catch { toast.success("File saved to Downloads."); }
  }

  async function importFile(f: File) {
    try {
      const text = (await f.text()).replace(/^\uFEFF/, "");
      const start = text.indexOf("{");
      const end = text.lastIndexOf("}");
      if (start < 0 || end < start) throw new Error("no data");
      const parsed = JSON.parse(text.slice(start, end + 1)) as { students?: Student[] };
      const inc = (parsed.students ?? []).filter((s) => s.classId === classId);
      if (!inc.length) { toast.error(`No ${className} learners found in that file.`); return; }
      const ids = new Set(list.map((s) => s.id));
      if (list.length + inc.filter((s) => !ids.has(s.id)).length > MAX_STUDENTS_PER_CLASS) {
        toast.error(`Import would exceed ${MAX_STUDENTS_PER_CLASS} learners in this class.`);
        return;
      }
      importStudents(inc);
      toast.success(`Imported ${inc.length} learner record(s) into ${className}.`);
    } catch {
      toast.error("That file could not be read.");
    }
  }

  const btn = "flex h-9 cursor-pointer items-center justify-center rounded-md border border-border px-4 text-xs font-bold hover:bg-muted";
  return (
    <div className="grid grid-cols-2 gap-2">
      <button onClick={exportFile} disabled={!list.length} className={`${btn} disabled:opacity-50`}>Export</button>
      <label className={btn}>
        Import
        <input type="file" accept="application/json,.json,text/plain,.txt,*/*" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) importFile(f); }} />
      </label>
    </div>
  );
}
