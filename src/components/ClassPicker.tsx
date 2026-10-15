import { useEffect } from "react";
import { CLASS_LEVELS, classShortLabel, getClassLevel, schoolClassIds, usesCat, type ClassId } from "@/lib/ges";
import { useAppData } from "@/lib/store";

export function ClassPicker({
  value,
  onChange,
  classes,
}: {
  value: ClassId;
  onChange: (c: ClassId) => void;
  /** Classes to show; defaults to the school's classes (with streams when set). */
  classes?: ClassId[];
}) {
  const { school } = useAppData();
  const level = getClassLevel(value);
  const list = classes ?? schoolClassIds(school);
  const streamed = list.length > CLASS_LEVELS.length;
  // If the selected class doesn't exist under the current stream setting, jump to the first one.
  useEffect(() => {
    if (!list.includes(value) && list[0]) onChange(list[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, list.length]);
  return (
    <section className="mt-5">
      <h2 className="text-[13px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Class</h2>
      <div className="mt-2 grid grid-cols-3 gap-1.5 sm:grid-cols-6 lg:grid-cols-11">
        {list.map((id) => {
          const c = getClassLevel(id);
          return (
            <button
              key={id}
              onClick={() => onChange(id)}
              className={
                id === value
                  ? "rounded-md bg-primary px-2 py-2.5 text-sm font-semibold text-primary-foreground"
                  : "rounded-md border border-border bg-card px-2 py-2.5 text-sm font-medium text-foreground hover:border-primary/40"
              }
            >
              {streamed ? classShortLabel(id) : c.name}
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        {level.stage} · {level.subjects.length} subjects · {usesCat(value) ? "SBA 50 (Tests, Project, Group) + Exam 50 = 100" : "Performance levels: Gold · Silver · Bronze"}
      </p>
    </section>
  );
}

export function TextField({
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
      <span className="text-[13px] font-bold uppercase tracking-[0.14em] text-foreground">{label}</span>
      <input
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 h-10 w-full rounded-md border border-border bg-card px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground/70 focus:border-primary focus:ring-2 focus:ring-primary/20"
      />
    </label>
  );
}

export { schoolClassIds };
