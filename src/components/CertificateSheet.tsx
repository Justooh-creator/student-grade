import type { School } from "@/lib/store";
import type { CertTheme } from "@/lib/certificates";

export type CertData = {
  learner: string; className: string; award: string; citation: string; date: string;
};

const THEME: Record<CertTheme, { title: string; name: string; body: string; ink: string; accent: string; border: string }> = {
  royal: { title: "'Cinzel', serif", name: "'Playfair Display', serif", body: "'Cormorant Garamond', serif", ink: "#13264f", accent: "#b8892b", border: "double 10px #b8892b" },
  prestige: { title: "'Playfair Display', serif", name: "'Great Vibes', cursive", body: "'Cormorant Garamond', serif", ink: "#4a2a12", accent: "#8b5a1d", border: "solid 3px #8b5a1d" },
  modern: { title: "'Sora', sans-serif", name: "'Sora', sans-serif", body: "'Manrope', sans-serif", ink: "#0f2a66", accent: "#1d4ed8", border: "solid 6px #1d4ed8" },
  chancellor: { title: "'Pinyon Script', cursive", name: "'Pinyon Script', cursive", body: "'Cormorant Garamond', serif", ink: "#1b1a16", accent: "#7a1f2b", border: "double 8px #7a1f2b" },
};

export function CertificateSheet({ data, school, theme, watermark }: { data: CertData; school: School; theme: CertTheme; watermark: boolean }) {
  const t = THEME[theme];
  return (
    <div className="certificate-page relative mx-auto mb-6 overflow-hidden shadow-[0_20px_50px_-30px_rgba(0,0,0,0.5)]"
      style={{ width: "297mm", height: "210mm", padding: "9mm", background: theme === "prestige" ? "#f6ecd6" : "#fffdf7", color: t.ink, breakAfter: "page" }}>
      {watermark && (
        <div aria-hidden className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
          <span className="-rotate-[25deg] whitespace-nowrap border-4 border-destructive/30 px-6 py-2 text-[24pt] font-black tracking-wider text-destructive/30">
            UNOFFICIAL PREVIEW • LICENSE REQUIRED TO PRINT
          </span>
        </div>
      )}
      <div className="flex h-full flex-col items-center px-[16mm] py-[8mm] text-center" style={{ border: t.border, outline: `1px solid ${t.accent}`, outlineOffset: "-5mm" }}>
        <div className="flex w-full items-center justify-center gap-4">
          {school.logo && <img src={school.logo} alt="School logo" className="h-[20mm] w-[20mm] object-contain" />}
          <div>
            <p style={{ fontFamily: "'Cinzel', serif" }} className="text-[17pt] font-extrabold uppercase tracking-wide">{school.name || "School Name"}</p>
            {school.motto?.trim() && <p style={{ fontFamily: t.body }} className="text-[11pt] italic">“{school.motto}”</p>}
            <p style={{ fontFamily: t.body }} className="text-[10pt]">{[school.district, school.region].filter(Boolean).join(", ")}</p>
          </div>
        </div>
        <h1 style={{ fontFamily: t.title, color: t.accent }} className="mt-[5mm] text-[38pt] leading-none">Certificate of Award</h1>
        <p style={{ fontFamily: t.body }} className="mt-[5mm] text-[14pt] italic">This certificate is proudly presented to</p>
        <p style={{ fontFamily: t.name }} className="mt-[2mm] min-w-[150mm] border-b px-6 text-[36pt] leading-tight" >{data.learner || "Learner Name"}</p>
        <p style={{ fontFamily: t.body }} className="mt-[2mm] text-[13pt]">of {data.className}</p>
        <p style={{ fontFamily: t.title, color: t.accent }} className="mt-[4mm] text-[22pt] font-bold uppercase tracking-wide">{data.award}</p>
        <p style={{ fontFamily: t.body }} className="mt-[2mm] max-w-[200mm] text-[14pt] italic">{data.citation}</p>
        <p style={{ fontFamily: t.body }} className="mt-[1mm] text-[12pt]">{school.term} · {school.academicYear} Academic Year</p>
        <div className="mt-auto grid w-full grid-cols-3 items-end gap-6 text-[11pt]" style={{ fontFamily: t.body }}>
          <div><div className="h-[14mm]" /><p className="border-t pt-1" style={{ borderColor: t.ink }}>Class Teacher</p></div>
          <div className="flex flex-col items-center">
            {school.stamp ? <img src={school.stamp} alt="" className="h-[22mm] object-contain" /> :
              <div className="flex h-[24mm] w-[24mm] items-center justify-center rounded-full text-[8pt] font-bold uppercase" style={{ background: `radial-gradient(circle, #f3d27a, ${t.accent})`, color: "#fff", boxShadow: `0 0 0 3px #fff, 0 0 0 5px ${t.accent}` }}>Seal of<br />Excellence</div>}
            <p className="mt-1">{data.date}</p>
          </div>
          <div>{school.signature ? <img src={school.signature} alt="" className="mx-auto h-[14mm] object-contain" /> : <div className="h-[14mm]" />}
            <p className="border-t pt-1" style={{ borderColor: t.ink }}>{school.headTeacher || "Headteacher / Proprietor"}</p></div>
        </div>
      </div>
    </div>
  );
}
