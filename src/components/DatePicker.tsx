import { useState } from "react";
import { format, parse, isValid } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

/** Popup calendar storing dates like "24th October 2026". */
export function ReopenPicker({ value, onChange, placeholder = "Pick reopening date" }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  const parsed = value ? parse(value, "do MMMM yyyy", new Date()) : undefined;
  const date = parsed && isValid(parsed) ? parsed : undefined;
  const [month, setMonth] = useState<Date>(date ?? new Date());
  return (
    <Popover onOpenChange={(o) => o && setMonth(date ?? new Date())}>
      <PopoverTrigger asChild>
        <button type="button" className="mt-1 flex h-10 w-full items-center gap-2 rounded-md border border-border bg-card px-3 text-left text-sm outline-none focus:border-primary">
          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          {value ? value : <span className="text-muted-foreground">{placeholder}</span>}
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
