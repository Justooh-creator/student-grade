export function PresetField({
  label,
  value,
  presets,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  presets: string[];
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const isPreset = presets.includes(value);
  return (
    <label className="block">
      <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </span>
      <select
        value={value === "" ? "" : isPreset ? value : "__custom"}
        onChange={(e) => {
          const v = e.target.value;
          if (v === "__custom") onChange(isPreset || !value ? " " : value);
          else onChange(v);
        }}
        className="mt-1 h-10 w-full rounded-md border border-border bg-card px-3 text-sm text-foreground outline-none focus:border-primary"
      >
        <option value="">{placeholder ?? "Select…"}</option>
        {presets.map((p) => (
          <option key={p} value={p}>{p}</option>
        ))}
        <option value="__custom">Custom text…</option>
      </select>
      {value !== "" && !isPreset && (
        <input
          autoFocus
          value={value.trimStart()}
          onChange={(e) => onChange(e.target.value || " ")}
          placeholder="Type your own text"
          className="mt-1.5 h-10 w-full rounded-md border border-border bg-card px-3 text-sm outline-none focus:border-primary"
        />
      )}
    </label>
  );
}
