import { createFileRoute, Link } from "@tanstack/react-router";
import { AppHeader } from "@/components/AppHeader";
import { useAppData } from "@/lib/store";

export const Route = createFileRoute("/setup")({
  head: () => ({
    meta: [
      { title: "School Setup — SBA Report Cards" },
      {
        name: "description",
        content:
          "Set school name, address, term, academic year, attendance days and signatories printed on every GES report card.",
      },
      { property: "og:title", content: "School Setup — SBA Report Cards" },
      {
        property: "og:description",
        content: "School and term details that appear on every printed A4 report card.",
      },
    ],
  }),
  component: SetupPage,
});

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </span>
      <input
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 h-10 w-full rounded-md border border-border bg-card px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground/70 focus:border-primary focus:ring-2 focus:ring-primary/20"
      />
    </label>
  );
}

const ACADEMIC_YEARS = Array.from({ length: 8 }, (_, i) => {
  const start = 2024 + i;
  return `${start}/${start + 1}`;
});

function SetupPage() {
  const { school, setSchool, students } = useAppData();

  return (
    <div className="min-h-screen bg-background pb-16">
      <AppHeader schoolName={school.name} term={school.term} year={school.academicYear} />
      <main className="mx-auto max-w-3xl px-4">
        <section className="mt-6 rounded-xl border border-border bg-card p-4 sm:p-6">
          <h1 className="text-lg font-semibold">School and term details</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Saved on this device and printed on every report card.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <Field
              label="School name"
              value={school.name}
              onChange={(v) => setSchool({ name: v })}
              placeholder="e.g. Adukrom Basic School"
            />
            <Field
              label="Address"
              value={school.address}
              onChange={(v) => setSchool({ address: v })}
              placeholder="P.O. Box 12, Koforidua"
            />
            <label className="block">
              <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Term
              </span>
              <select
                value={school.term}
                onChange={(e) => setSchool({ term: e.target.value })}
                className="mt-1 h-10 w-full rounded-md border border-border bg-card px-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                <option value="">Select term</option>
                {["Term 1", "Term 2", "Term 3"].map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Academic year
              </span>
              <select
                value={school.academicYear}
                onChange={(e) => setSchool({ academicYear: e.target.value })}
                className="num mt-1 h-10 w-full rounded-md border border-border bg-card px-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                <option value="">Select year</option>
                {ACADEMIC_YEARS.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </label>
            <Field
              label="Class teacher"
              value={school.classTeacher}
              onChange={(v) => setSchool({ classTeacher: v })}
              placeholder="Name of class teacher"
            />
            <Field
              label="Head teacher"
              value={school.headTeacher}
              onChange={(v) => setSchool({ headTeacher: v })}
              placeholder="Name of head teacher"
            />
            <Field
              label="Day school reopens"
              value={school.reopeningDate}
              onChange={(v) => setSchool({ reopeningDate: v })}
              placeholder="6th January 2026"
            />
            <Field
              label="Total attendance days"
              value={school.totalAttendance}
              onChange={(v) => setSchool({ totalAttendance: v })}
              placeholder="60"
            />
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
            <p className="num text-xs text-muted-foreground">
              {students.length} learner{students.length === 1 ? "" : "s"} recorded
            </p>
            <Link
              to="/"
              className="flex h-11 items-center justify-center rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground hover:opacity-90"
            >
              Go to score entry
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
