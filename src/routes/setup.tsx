import { createFileRoute, Link } from "@tanstack/react-router";
import { AppHeader } from "@/components/AppHeader";
import { validateClassSearch } from "@/lib/classSearch";
import { useAppData } from "@/lib/store";
import { useState } from "react";
import { format, parse, isValid } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { GHANA_REGIONS, REGION_NAMES } from "@/lib/ghana";

function shrinkImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, 240 / Math.max(img.width, img.height));
        const c = document.createElement("canvas");
        c.width = Math.round(img.width * scale);
        c.height = Math.round(img.height * scale);
        c.getContext("2d")?.drawImage(img, 0, 0, c.width, c.height);
        resolve(c.toDataURL("image/png"));
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export const Route = createFileRoute("/setup")({
  validateSearch: validateClassSearch,
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
  const search = Route.useSearch();

  return (
    <div className="min-h-screen bg-background pb-16">
      <AppHeader schoolName={school.name} term={school.term} year={school.academicYear} activeClass={search.class} />
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
                Region
              </span>
              <select
                value={school.region}
                onChange={(e) => setSchool({ region: e.target.value, district: "" })}
                className="mt-1 h-10 w-full rounded-md border border-border bg-card px-3 text-sm text-foreground outline-none focus:border-primary"
              >
                <option value="">Select region</option>
                {REGION_NAMES.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                District
              </span>
              <select
                value={school.district}
                disabled={!school.region}
                onChange={(e) => setSchool({ district: e.target.value })}
                className="mt-1 h-10 w-full rounded-md border border-border bg-card px-3 text-sm text-foreground outline-none focus:border-primary disabled:opacity-50"
              >
                <option value="">{school.region ? "Select district" : "Choose a region first"}</option>
                {(GHANA_REGIONS[school.region] ?? []).map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </label>
            <div className="sm:col-span-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                School logo
              </span>
              <div className="mt-1 flex items-center gap-3">
                <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-md border border-dashed border-border bg-background">
                  {school.logo ? (
                    <img src={school.logo} alt="School logo" className="h-full w-full object-contain" />
                  ) : (
                    <span className="text-[10px] text-muted-foreground">No logo</span>
                  )}
                </div>
                <label className="cursor-pointer rounded-md border border-border px-3 py-2 text-xs font-semibold hover:bg-muted">
                  Upload logo
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (f) setSchool({ logo: await shrinkImage(f) });
                    }}
                  />
                </label>
                {school.logo && (
                  <button onClick={() => setSchool({ logo: "" })} className="text-xs text-muted-foreground hover:text-destructive">
                    Remove
                  </button>
                )}
              </div>
            </div>
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
            <div className="block">
              <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Day school reopens
              </span>
              <ReopenPicker value={school.reopeningDate} onChange={(v) => setSchool({ reopeningDate: v })} />
            </div>
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

function ReopenPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const parsed = value ? parse(value, "do MMMM yyyy", new Date()) : undefined;
  const date = parsed && isValid(parsed) ? parsed : undefined;
  const [month, setMonth] = useState<Date>(date ?? new Date());
  return (
    <Popover onOpenChange={(o) => o && setMonth(date ?? new Date())}>
      <PopoverTrigger asChild>
        <button type="button" className="mt-1 flex h-10 w-full items-center gap-2 rounded-md border border-border bg-card px-3 text-left text-sm outline-none focus:border-primary">
          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          {value ? value : <span className="text-muted-foreground">Pick reopening date</span>}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          month={month}
          onMonthChange={setMonth}
          onSelect={(d) => d && onChange(format(d, "do MMMM yyyy"))}
          className="p-3 pointer-events-auto"
        />
      </PopoverContent>
    </Popover>
  );
}
