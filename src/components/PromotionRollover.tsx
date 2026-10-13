import { useState } from "react";
import { toast } from "sonner";
import { getData, updateData } from "@/lib/store";
import { getClassLevel } from "@/lib/ges";
import { nextAcademicYear, rolloverStudents, rolloverSummary } from "@/lib/promotion";

function downloadBackup() {
  const d = getData();
  const name = `EduReport-Archive-${d.school.academicYear.replace("/", "-")}-${d.school.term.replace(" ", "")}.json`;
  const blob = new Blob([JSON.stringify(d, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

export function PromotionRollover({ year }: { year: string }) {
  const [open, setOpen] = useState(false);
  const students = getData().students;
  const sum = rolloverSummary(students);
  const next = nextAcademicYear(year);

  function run() {
    try {
      downloadBackup();
      updateData((cur) => ({
        ...cur,
        students: rolloverStudents(cur.students),
        school: { ...cur.school, academicYear: nextAcademicYear(cur.school.academicYear), term: "Term 1" },
      }));
      setOpen(false);
      toast.success(`Welcome to ${next}! Learners moved to their new classes.`);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <section className="mt-6 rounded-xl border-2 border-primary/40 bg-card p-4 sm:p-6">
      <h2 className="text-lg font-bold">🎓 End-of-Year Promotion &amp; Rollover</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        After printing Term 3 reports, move learners to their new classes for {next}. Names, admission numbers, photos and parent phones are kept; marks, attendance and remarks start fresh.
      </p>
      {!open ? (
        <button onClick={() => setOpen(true)} disabled={students.length === 0}
          className="mt-4 h-11 rounded-md bg-primary px-5 text-sm font-bold text-primary-foreground disabled:opacity-50">
          Review promotion
        </button>
      ) : (
        <div className="mt-4 space-y-3 text-sm">
          <ul className="list-disc space-y-1 pl-5">
            <li><b>{sum.promoted}</b> will move up to the next class</li>
            <li><b>{sum.retained}</b> will stay in their class</li>
            <li><b>{sum.completed}</b> Basic 9 learner(s) complete JHS and leave the register</li>
          </ul>
          {sum.undecided.length > 0 && (
            <div className="rounded-md border-l-4 border-destructive bg-destructive/10 p-3">
              <p className="font-bold">{sum.undecided.length} learner(s) are still "To be decided":</p>
              <p className="mt-1">{sum.undecided.slice(0, 15).map((s) => `${s.name} (${getClassLevel(s.classId).name})`).join(", ")}{sum.undecided.length > 15 ? "…" : ""}</p>
              <p className="mt-1">Set Promoted or Retained for each on the SBA page before continuing.</p>
            </div>
          )}
          <p className="text-muted-foreground">A backup of all Term 3 records downloads automatically first.</p>
          <div className="flex flex-wrap gap-2">
            <button onClick={run} disabled={sum.undecided.length > 0}
              className="h-11 rounded-md bg-primary px-5 text-sm font-bold text-primary-foreground disabled:opacity-50">
              Start {next}
            </button>
            <button onClick={() => setOpen(false)} className="h-11 rounded-md border border-border px-5 text-sm font-bold">Cancel</button>
          </div>
        </div>
      )}
    </section>
  );
}
