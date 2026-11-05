import type { School } from "@/lib/store";
import type { CertTheme } from "@/lib/certificates";

export type PhotoAdjust = { src: string; zoom: number; x: number; y: number };
export type CertData = {
  recipient: "learner" | "staff";
  name: string;
  /** Learner: class name. Staff: position / designation. */
  line1: string;
  /** Staff: subject / department. */
  line2?: string;
  award: string; citation: string; date: string;
  occasion: string;
  leftSigner: string; leftSignature?: string;
  photo?: PhotoAdjust;
};
export type PhotoMode = "none" | "passport" | "full";

/* Certificate artwork palettes — print colours, intentionally fixed per template. */
type T = { bg: string; ink: string; accent: string; accent2: string; title: string; name: string; body: string; dark?: boolean };
const THEME: Record<CertTheme | "executive", T> = {
  royal: { bg: "linear-gradient(135deg,#fbf6e6,#f3e7c4)", ink: "#2b2410", accent: "#b8892b", accent2: "#e5c56b", title: "'Cinzel', serif", name: "'Playfair Display', serif", body: "'Cormorant Garamond', serif" },
  prestige: { bg: "radial-gradient(circle,#f8eedb,#ead6ad)", ink: "#4a1620", accent: "#7a1f2b", accent2: "#a8812f", title: "'Great Vibes', cursive", name: "'Playfair Display', serif", body: "'Cormorant Garamond', serif" },
  modern: { bg: "#ffffff", ink: "#0f2350", accent: "#0f2350", accent2: "#c9a23a", title: "'Sora', sans-serif", name: "'Sora', sans-serif", body: "'Manrope', sans-serif" },
  chancellor: { bg: "linear-gradient(135deg,#fbf7ea,#efe6cc)", ink: "#0f3b2c", accent: "#0f5c3f", accent2: "#b8892b", title: "'Pinyon Script', cursive", name: "'Cinzel', serif", body: "'Cormorant Garamond', serif" },
  elite: { bg: "radial-gradient(circle,#262626,#0b0b0b)", ink: "#f4e3b0", accent: "#d4af37", accent2: "#f1d67a", title: "'Cinzel', serif", name: "'Playfair Display', serif", body: "'Cormorant Garamond', serif", dark: true },
  young: { bg: "linear-gradient(135deg,#fffaf0,#eef6ff)", ink: "#1e3a8a", accent: "#e85d2a", accent2: "#16a34a", title: "'Sora', sans-serif", name: "'Playfair Display', serif", body: "'Manrope', sans-serif" },
  executive: { bg: "linear-gradient(135deg,#ffffff,#eef2fb)", ink: "#13264f", accent: "#1d3a7a", accent2: "#c9a23a", title: "'Cinzel', serif", name: "'Playfair Display', serif", body: "'Manrope', sans-serif" },
};

function Corner({ t, kind, style }: { t: T; kind: CertTheme | "executive"; style: React.CSSProperties }) {
  if (kind === "modern" || kind === "executive") return (
    <svg viewBox="0 0 100 100" style={style} aria-hidden>
      <polygon points="0,0 70,0 0,70" fill={t.accent} /><polygon points="0,0 48,0 0,48" fill={t.accent2} />
      <polygon points="80,0 100,0 0,100 0,80" fill={t.accent} opacity=".25" />
    </svg>);
  if (kind === "young") return (
    <svg viewBox="0 0 100 100" style={style} aria-hidden>
      <Star cx={22} cy={22} r={16} fill="#f5b301" /><Star cx={58} cy={14} r={8} fill={t.accent} /><Star cx={14} cy={58} r={8} fill={t.accent2} />
      <circle cx="46" cy="44" r="5" fill="#38bdf8" />
    </svg>);
  return (
    <svg viewBox="0 0 100 100" style={style} aria-hidden fill="none" stroke={t.accent} strokeLinecap="round">
      <path d="M6 96 V34 Q6 6 34 6 H96" strokeWidth="3" />
      <path d="M16 96 V40 Q16 16 40 16 H96" strokeWidth="1.2" stroke={t.accent2} />
      <path d="M34 6 Q44 30 22 34 Q30 46 6 44" strokeWidth="1.6" />
      <path d="M26 26 q10 -14 22 -4 q-6 10 -18 8" strokeWidth="1.4" stroke={t.accent2} />
      <circle cx="26" cy="26" r="4" fill={t.accent} stroke="none" />
      <path d="M60 6 q8 8 16 0 M6 60 q8 8 0 16" strokeWidth="1.4" />
    </svg>);
}

function Star({ cx, cy, r, fill }: { cx: number; cy: number; r: number; fill: string }) {
  const pts = Array.from({ length: 10 }, (_, i) => {
    const a = (Math.PI / 5) * i - Math.PI / 2; const rr = i % 2 ? r * 0.45 : r;
    return `${cx + rr * Math.cos(a)},${cy + rr * Math.sin(a)}`;
  }).join(" ");
  return <polygon points={pts} fill={fill} />;
}

function Seal({ t, label }: { t: T; label: string }) {
  const burst = Array.from({ length: 48 }, (_, i) => {
    const a = (Math.PI / 24) * i; const r = i % 2 ? 44 : 48;
    return `${50 + r * Math.cos(a)},${50 + r * Math.sin(a)}`;
  }).join(" ");
  const leaves: React.ReactNode[] = [];
  for (let d = 105; d <= 245; d += 14) for (const side of [d, 180 - d]) {
    const a = (side * Math.PI) / 180;
    leaves.push(<ellipse key={side} cx={50 + 31 * Math.cos(a)} cy={50 + 31 * Math.sin(a)} rx="2.4" ry="5.5" fill={t.dark ? "#1a1a1a" : "#fff"} opacity=".85" transform={`rotate(${side + 90 + (side > 90 && side < 270 ? 25 : -25)} ${50 + 31 * Math.cos(a)} ${50 + 31 * Math.sin(a)})`} />);
  }
  return (
    <svg viewBox="0 0 100 100" style={{ width: "28mm", height: "28mm" }} aria-hidden>
      <defs><radialGradient id={`g-${t.accent}`}><stop offset="0" stopColor={t.accent2} /><stop offset="1" stopColor={t.accent} /></radialGradient></defs>
      <polygon points={burst} fill={`url(#g-${t.accent})`} />
      <circle cx="50" cy="50" r="38" fill="none" stroke={t.dark ? "#1a1a1a" : "#fff"} strokeWidth="1.2" />
      {leaves}
      <Star cx={50} cy={40} r={8} fill={t.dark ? "#1a1a1a" : "#fff"} />
      <text x="50" y="62" textAnchor="middle" fontSize="7.5" fontWeight="700" fill={t.dark ? "#1a1a1a" : "#fff"} fontFamily="Cinzel, serif">{label}</text>
    </svg>);
}

function YoungArt() {
  return (
    <svg viewBox="0 0 200 40" style={{ position: "absolute", bottom: "13mm", left: "16mm", width: "45mm" }} aria-hidden>
      <rect x="4" y="12" width="34" height="24" rx="2" fill="#38bdf8" /><rect x="21" y="12" width="2" height="24" fill="#fff" />
      <g transform="rotate(-30 80 24)"><rect x="50" y="20" width="50" height="9" fill="#f5b301" /><polygon points="100,20 112,24.5 100,29" fill="#e8b48a" /><rect x="46" y="20" width="5" height="9" fill="#e85d2a" /></g>
      <path d="M140 8 h26 v8 a13 13 0 0 1 -26 0z" fill="#f5b301" /><rect x="150" y="28" width="6" height="6" fill="#f5b301" /><rect x="144" y="34" width="18" height="4" fill="#e85d2a" />
    </svg>);
}

function Photo({ p, w, h, t }: { p?: PhotoAdjust; w: number; h: number; t: T }) {
  return (
    <div style={{ width: `${w}mm`, height: `${h}mm`, border: `1.2mm solid ${t.accent2}`, outline: `0.4mm solid ${t.accent}`, outlineOffset: "0.8mm", overflow: "hidden", background: t.dark ? "#222" : "#f1ede3", flexShrink: 0 }}
      className="flex items-center justify-center">
      {p?.src
        ? <img src={p.src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", transform: `translate(${p.x}%, ${p.y}%) scale(${p.zoom})` }} />
        : <span style={{ fontSize: "9pt", color: t.ink, opacity: 0.5 }}>Photo</span>}
    </div>);
}

/** One certificate at the given page size (mm). Artwork is designed at A4 width and scaled for larger paper. */
export function CertificateSheet({ data, school, theme, watermark, photoMode = "none", size = { w: 297, h: 210 } }: {
  data: CertData; school: School; theme: CertTheme; watermark: boolean; photoMode?: PhotoMode; size?: { w: number; h: number };
}) {
  const kind = theme === "young" && data.recipient === "staff" ? "executive" : theme;
  const t = THEME[kind];
  const portrait = size.h > size.w;
  const baseW = portrait ? 210 : 297;
  const baseH = (baseW * size.h) / size.w;
  const zoom = size.w / baseW;
  const staff = data.recipient === "staff";
  const full = photoMode === "full";
  const frame = theme === "royal" || theme === "elite" ? `double 2.4mm ${t.accent}` : theme === "young" ? `1.6mm dashed ${t.accent2}` : `1.4mm solid ${t.accent}`;
  const cornerSize = theme === "young" ? "30mm" : "26mm";
  const corner = (r: number, pos: React.CSSProperties) => <Corner t={t} kind={kind} style={{ position: "absolute", width: cornerSize, height: cornerSize, transform: `rotate(${r}deg)`, ...pos }} />;

  const text = (
    <div className="flex flex-1 flex-col items-center text-center" style={{ minWidth: 0 }}>
      <p style={{ fontFamily: t.body }} className="text-[14pt] italic">This certificate is proudly presented to</p>
      <p style={{ fontFamily: t.name, borderColor: t.accent2 }} className={`mt-[2mm] border-b-2 px-6 font-bold leading-tight ${portrait ? "text-[30pt]" : "text-[36pt]"}`}>{data.name || (staff ? "Staff Name" : "Learner Name")}</p>
      <p style={{ fontFamily: t.body }} className="mt-[2mm] text-[13pt]">{staff ? [data.line1, data.line2].filter(Boolean).join(" · ") : data.line1 ? `of ${data.line1}` : ""}</p>
      <p style={{ fontFamily: kind === "modern" || kind === "young" ? t.title : "'Cinzel', serif", color: t.accent }} className="mt-[4mm] text-[21pt] font-extrabold uppercase tracking-wide">{data.award}</p>
      <p style={{ fontFamily: t.body }} className="mt-[2mm] max-w-[200mm] text-[14pt] italic">{data.citation}</p>
      <p style={{ fontFamily: t.body }} className="mt-[1mm] text-[12pt]">{data.occasion}</p>
    </div>);

  return (
    <div className="certificate-page relative mx-auto overflow-hidden" style={{ width: `${size.w}mm`, height: `${size.h}mm`, background: t.bg, color: t.ink, breakAfter: "page" }}>
      <div style={{ width: `${baseW}mm`, height: `${baseH}mm`, zoom, position: "relative" }}>
        <div aria-hidden style={{ position: "absolute", inset: "6mm", border: frame }} />
        <div aria-hidden style={{ position: "absolute", inset: "10mm", border: `0.4mm solid ${t.accent2}` }} />
        {corner(0, { top: "4mm", left: "4mm" })}{corner(90, { top: "4mm", right: "4mm" })}
        {corner(270, { bottom: "4mm", left: "4mm" })}{corner(180, { bottom: "4mm", right: "4mm" })}
        {theme === "young" && !staff && <YoungArt />}
        {watermark && (
          <div aria-hidden className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
            <span className="-rotate-[25deg] whitespace-nowrap border-4 px-6 py-2 text-[22pt] font-black tracking-wider" style={{ color: "rgba(200,30,30,.32)", borderColor: "rgba(200,30,30,.32)" }}>
              UNOFFICIAL PREVIEW • LICENSE REQUIRED TO PRINT
            </span>
          </div>
        )}
        <div className="relative z-10 flex h-full flex-col items-center px-[22mm] py-[15mm] text-center">
          <div className="flex w-full items-center justify-center gap-4">
            {school.logo && <img src={school.logo} alt="School logo" className="h-[20mm] w-[20mm] object-contain" />}
            <div className="max-w-[170mm]">
              <p style={{ fontFamily: "'Cinzel', serif" }} className="text-[16pt] font-extrabold uppercase tracking-wide">{school.name || "School Name"}</p>
              {school.motto?.trim() && <p style={{ fontFamily: t.body }} className="text-[11pt] italic">“{school.motto}”</p>}
              <p style={{ fontFamily: t.body }} className="text-[10pt]">{[school.district, school.region].filter(Boolean).join(", ")}</p>
            </div>
          </div>
          {photoMode === "passport" && <div style={{ position: "absolute", top: "15mm", right: "20mm" }}><Photo p={data.photo} w={24} h={30} t={t} /></div>}
          <h1 style={{ fontFamily: t.title, color: t.accent }} className={`mt-[4mm] leading-none ${kind === "modern" || kind === "young" || kind === "executive" ? "text-[30pt] font-bold uppercase tracking-wider" : "text-[38pt]"}`}>
            {staff ? "Certificate of Recognition" : kind === "young" ? "Super Star Award" : "Certificate of Award"}
          </h1>
          <div className={`mt-[5mm] flex w-full flex-1 items-center gap-[8mm] ${portrait ? "flex-col justify-start" : "justify-center"}`}>
            {full && <Photo p={data.photo} w={portrait ? 46 : 46} h={portrait ? 56 : 58} t={t} />}
            {text}
          </div>
          <div className="grid w-full grid-cols-3 items-end gap-6 text-[11pt]" style={{ fontFamily: t.body }}>
            <div>{data.leftSignature ? <img src={data.leftSignature} alt="" className="mx-auto h-[14mm] object-contain" /> : <div className="h-[14mm]" />}
              <p className="border-t pt-1" style={{ borderColor: t.ink }}>{data.leftSigner}</p></div>
            <div className="flex flex-col items-center">
              {school.stamp ? <img src={school.stamp} alt="" className="h-[22mm] object-contain" /> : <Seal t={t} label="EXCELLENCE" />}
              <p className="mt-1">{data.date}</p>
            </div>
            <div>{school.signature ? <img src={school.signature} alt="" className="mx-auto h-[14mm] object-contain" /> : <div className="h-[14mm]" />}
              <p className="border-t pt-1" style={{ borderColor: t.ink }}>{school.headTeacher || "Headteacher / Proprietor"}</p></div>
          </div>
        </div>
      </div>
    </div>
  );
}
