import type { School } from "@/lib/store";
import { DEFAULT_DISPLAY, headerLines, type CertTheme, type CertDisplay, type Medallion, type PhotoFrame, type CertFonts } from "@/lib/certificates";

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
  leftSigner: string | null; leftSignature?: string;
  rightSigner?: string; rightName?: string;
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
  royalblue: { bg: "linear-gradient(160deg,#fffdf6,#f7efd9)", ink: "#0a2558", accent: "#0a2558", accent2: "#d4a017", title: "'Cinzel', serif", name: "'Great Vibes', cursive", body: "'Cormorant Garamond', serif" },
  platinum: { bg: "linear-gradient(135deg,#fafafa,#e7e9ec)", ink: "#2a2f36", accent: "#4b5563", accent2: "#9ca3af", title: "'Cinzel', serif", name: "'Playfair Display', serif", body: "'Cormorant Garamond', serif" },
  grand: { bg: "linear-gradient(135deg,#fdf9ee,#f1e6c8)", ink: "#2d2312", accent: "#6b4f1d", accent2: "#c49a3a", title: "'Pinyon Script', cursive", name: "'Cinzel', serif", body: "'Cormorant Garamond', serif" },
  emerald: { bg: "radial-gradient(circle,#0f4d36,#08291d)", ink: "#f3e6bf", accent: "#d4af37", accent2: "#f1d67a", title: "'Cinzel', serif", name: "'Great Vibes', cursive", body: "'Cormorant Garamond', serif", dark: true },
  minimal: { bg: "#ffffff", ink: "#111827", accent: "#111827", accent2: "#c9a23a", title: "'Sora', sans-serif", name: "'Playfair Display', serif", body: "'Manrope', sans-serif" },
  african: { bg: "linear-gradient(135deg,#fffaf0,#f6ead0)", ink: "#3b2205", accent: "#8a4b0f", accent2: "#d4a017", title: "'Cinzel', serif", name: "'Playfair Display', serif", body: "'Cormorant Garamond', serif" },
  executive: { bg: "linear-gradient(135deg,#ffffff,#eef2fb)", ink: "#13264f", accent: "#1d3a7a", accent2: "#c9a23a", title: "'Cinzel', serif", name: "'Playfair Display', serif", body: "'Manrope', sans-serif" },
};

function Corner({ t, kind, style }: { t: T; kind: CertTheme | "executive"; style: React.CSSProperties }) {
  if (kind === "african") return (
    <svg viewBox="0 0 100 100" style={style} aria-hidden fill="none" stroke={t.accent} strokeWidth="2.2">
      {/* Dwennimmen-inspired ram's horns */}
      <path d="M20 20 q14 -14 26 0 q-12 4 -12 14 M20 20 q-14 14 0 26 q4 -12 14 -12" />
      <path d="M34 34 q14 -14 26 0 q-12 4 -12 14 M34 34 q-14 14 0 26 q4 -12 14 -12" stroke={t.accent2} />
      {/* Mate Masie-inspired knot */}
      <rect x="64" y="8" width="14" height="14" /><rect x="8" y="64" width="14" height="14" />
      <circle cx="71" cy="15" r="2.5" fill={t.accent2} /><circle cx="15" cy="71" r="2.5" fill={t.accent2} />
    </svg>);
  if (kind === "minimal") return (
    <svg viewBox="0 0 100 100" style={style} aria-hidden><path d="M8 60 V8 H60" fill="none" stroke={t.accent2} strokeWidth="2" /></svg>);
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

function Seal({ t, label, medallion = "star", crest }: { t: T; label: string; medallion?: Medallion; crest?: string }) {
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
      {medallion === "crest" && crest
        ? <image href={crest} x="36" y="26" width="28" height="28" preserveAspectRatio="xMidYMid meet" />
        : medallion === "crest"
          ? <path d="M40 28 h20 v12 q0 10 -10 14 q-10 -4 -10 -14z" fill={t.dark ? "#1a1a1a" : "#fff"} />
          : medallion === "trophy"
            ? <g fill={t.dark ? "#1a1a1a" : "#fff"}><path d="M41 29 h18 v6 a9 9 0 0 1 -18 0z" /><path d="M41 31 h-4 a4 4 0 0 0 4 6 M59 31 h4 a4 4 0 0 1 -4 6" fill="none" stroke={t.dark ? "#1a1a1a" : "#fff"} strokeWidth="1.4" /><rect x="48.5" y="43" width="3" height="5" /><rect x="44" y="48" width="12" height="3" /></g>
            : <Star cx={50} cy={40} r={8} fill={t.dark ? "#1a1a1a" : "#fff"} />}
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

function Photo({ p, w, h, t, frame = "rect" }: { p?: PhotoAdjust | undefined; w: number; h: number; t: T; frame?: PhotoFrame }) {
  const W = frame === "circle" ? Math.min(w, h) : w; const H = frame === "circle" ? W : h;
  return (
    <div style={{ width: `${W}mm`, height: `${H}mm`, borderRadius: frame === "rect" ? 0 : "50%", border: `1.2mm solid ${t.accent2}`, outline: `0.4mm solid ${t.accent}`, outlineOffset: frame === "rect" ? "0.8mm" : 0, overflow: "hidden", background: t.dark ? "#222" : "#f1ede3", flexShrink: 0 }}
      className="flex items-center justify-center">
      {p?.src
        ? <img src={p.src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", transform: `translate(${p.x}%, ${p.y}%) scale(${p.zoom})` }} />
        : <span style={{ fontSize: "9pt", color: t.ink, opacity: 0.5 }}>Photo</span>}
    </div>);
}

function Ribbons() {
  return (<>
    <svg viewBox="0 0 300 120" preserveAspectRatio="none" aria-hidden style={{ position: "absolute", top: 0, left: 0, width: "120mm", height: "46mm" }}>
      <defs><linearGradient id="rb-gold" x1="0" x2="1"><stop offset="0" stopColor="#b8860b" /><stop offset=".45" stopColor="#f5d061" /><stop offset=".55" stopColor="#fff6c8" /><stop offset="1" stopColor="#c8961e" /></linearGradient></defs>
      <path d="M0 0 H300 Q180 20 110 60 T0 115 Z" fill="#0a2558" />
      <path d="M0 0 H230 Q150 22 95 52 T0 92 Z" fill="#1e3a8a" />
      <path d="M0 98 Q60 80 110 62 T300 2 L300 8 Q190 30 116 70 T0 106 Z" fill="url(#rb-gold)" />
    </svg>
    <svg viewBox="0 0 300 120" preserveAspectRatio="none" aria-hidden style={{ position: "absolute", bottom: 0, right: 0, width: "120mm", height: "46mm", transform: "rotate(180deg)" }}>
      <path d="M0 0 H300 Q180 20 110 60 T0 115 Z" fill="#0a2558" />
      <path d="M0 0 H230 Q150 22 95 52 T0 92 Z" fill="#1e3a8a" />
      <path d="M0 98 Q60 80 110 62 T300 2 L300 8 Q190 30 116 70 T0 106 Z" fill="url(#rb-gold)" />
    </svg>
  </>);
}

function Kente({ pos }: { pos: React.CSSProperties }) {
  const cols = ["#d4a017", "#0b6b3a", "#b91c1c", "#111827", "#d4a017", "#0b6b3a"];
  return (
    <svg viewBox="0 0 240 10" preserveAspectRatio="none" aria-hidden style={{ position: "absolute", left: "10mm", right: "10mm", height: "5mm", width: "calc(100% - 20mm)", ...pos }}>
      {Array.from({ length: 48 }, (_, i) => <rect key={i} x={i * 5} y="0" width="5" height="10" fill={cols[i % cols.length]} />)}
      {Array.from({ length: 24 }, (_, i) => <rect key={`z${i}`} x={i * 10 + 2} y="3.5" width="3" height="3" fill="#fffaf0" />)}
    </svg>);
}

function Laurel({ color, flip }: { color: string; flip?: boolean }) {
  return (
    <svg viewBox="0 0 40 80" aria-hidden style={{ width: "10mm", height: "20mm", transform: flip ? "scaleX(-1)" : undefined }}>
      <path d="M30 78 Q8 50 22 4" fill="none" stroke={color} strokeWidth="1.6" />
      {Array.from({ length: 7 }, (_, i) => <ellipse key={i} cx={20 - i * 0.6 + (i % 2 ? 6 : -4)} cy={70 - i * 10} rx="3" ry="6.5" fill={color} transform={`rotate(${i % 2 ? 35 : -35} ${20 + (i % 2 ? 6 : -4)} ${70 - i * 10})`} />)}
    </svg>);
}

/** One certificate at the given page size (mm). Artwork is designed at A4 width and scaled for larger paper. */
export function CertificateSheet({ data, school, theme, watermark, photoMode = "none", size = { w: 297, h: 210 }, display = DEFAULT_DISPLAY, medallion = "trophy", frame: photoFrame = "rect", fonts }: {
  data: CertData; school: School; theme: CertTheme; watermark: boolean; photoMode?: PhotoMode; size?: { w: number; h: number };
  display?: CertDisplay; medallion?: Medallion; frame?: PhotoFrame; fonts?: Partial<CertFonts>;
}) {
  const d = display;
  const f = { heading: fonts?.heading || "", name: fonts?.name || "", award: fonts?.award || "", citation: fonts?.citation || "" };
  const lines = headerLines(school, d);
  const kind = theme === "young" && data.recipient === "staff" ? "executive" : theme;
  const t = THEME[kind];
  const portrait = size.h > size.w;
  const baseW = portrait ? 210 : 297;
  const baseH = (baseW * size.h) / size.w;
  const zoom = size.w / baseW;
  const staff = data.recipient === "staff";
  const full = photoMode === "full";
  const frame = theme === "royalblue" ? `1.8mm solid #d4a017` : theme === "grand" ? `double 3mm ${t.accent2}` : theme === "minimal" ? `0.4mm solid ${t.accent2}` : theme === "royal" || theme === "elite" || theme === "emerald" ? `double 2.4mm ${t.accent}` : theme === "young" ? `1.6mm dashed ${t.accent2}` : `1.4mm solid ${t.accent}`;
  const cornerSize = theme === "young" ? "30mm" : "26mm";
  const corner = (r: number, pos: React.CSSProperties) => <Corner t={t} kind={kind} style={{ position: "absolute", width: cornerSize, height: cornerSize, transform: `rotate(${r}deg)`, ...pos }} />;

  const text = (
    <div className="flex flex-1 flex-col items-center text-center" style={{ minWidth: 0 }}>
      <p style={{ fontFamily: t.body }} className="text-[14pt] italic">This certificate is proudly presented to</p>
      <p style={{ fontFamily: f.name || t.name, borderColor: t.accent2, color: kind === "royalblue" ? "#0a2558" : undefined }} className={`mt-[2mm] border-b-2 px-6 leading-tight ${t.name.includes("cursive") ? "font-normal" : "font-bold"} ${portrait ? "text-[32pt]" : "text-[40pt]"}`}>{data.name || (staff ? "Staff Name" : "Learner Name")}</p>
      {d.className && <p style={{ fontFamily: t.body }} className="mt-[2mm] text-[13pt]">{staff ? [data.line1, data.line2].filter(Boolean).join(" · ") : data.line1 ? `of ${data.line1}` : ""}</p>}
      <p style={{ fontFamily: f.award || (kind === "modern" || kind === "young" || kind === "minimal" ? t.title : "'Cinzel', serif"), color: kind === "royalblue" ? "#b8860b" : t.accent }} className="mt-[4mm] text-[21pt] font-extrabold uppercase tracking-wide">{data.award}</p>
      {d.citation && data.citation && <p style={{ fontFamily: f.citation || t.body }} className="mt-[2mm] max-w-[200mm] text-[14pt] italic">{data.citation}</p>}
      {d.occasion && data.occasion && <p style={{ fontFamily: t.body }} className="mt-[1mm] text-[12pt]">{data.occasion}</p>}
    </div>);

  return (
    <div className="certificate-page relative mx-auto overflow-hidden" style={{ width: `${size.w}mm`, height: `${size.h}mm`, background: t.bg, color: t.ink, breakAfter: "page" }}>
      <div style={{ width: `${baseW}mm`, height: `${baseH}mm`, zoom, position: "relative" }}>
        <div aria-hidden style={{ position: "absolute", inset: "6mm", border: frame }} />
        <div aria-hidden style={{ position: "absolute", inset: "10mm", border: `0.4mm solid ${t.accent2}` }} />
        {corner(0, { top: "4mm", left: "4mm" })}{corner(90, { top: "4mm", right: "4mm" })}
        {corner(270, { bottom: "4mm", left: "4mm" })}{corner(180, { bottom: "4mm", right: "4mm" })}
        {d.watermarkBg && <div aria-hidden style={{ position: "absolute", inset: "10mm", opacity: t.dark ? 0.08 : 0.06, backgroundImage: `repeating-radial-gradient(circle at 50% 50%, ${t.accent} 0 0.3mm, transparent 0.3mm 2.2mm)` }} />}
        {kind === "royalblue" && <Ribbons />}
        {kind === "african" && <><Kente pos={{ top: "11mm" }} /><Kente pos={{ bottom: "11mm" }} /></>}
        {theme === "young" && !staff && <YoungArt />}
        {watermark && (
          <div aria-hidden className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
            <span className="-rotate-[25deg] whitespace-nowrap border-4 px-6 py-2 text-[22pt] font-black tracking-wider" style={{ color: "rgba(200,30,30,.32)", borderColor: "rgba(200,30,30,.32)" }}>
              UNOFFICIAL PREVIEW • LICENSE REQUIRED TO PRINT
            </span>
          </div>
        )}
        <div className="relative z-10 flex h-full flex-col items-center px-[22mm] py-[15mm] text-center">
          {(lines.length > 0 || (d.logo && school.logo)) && <div className="flex w-full items-center justify-center gap-4">
            {d.logo && school.logo && <img src={school.logo} alt="School logo" className="h-[20mm] w-[20mm] object-contain" />}
            {lines.length > 0 && <div className="max-w-[170mm]">
              {lines.map((l) => l.kind === "name"
                ? <p key="n" style={{ fontFamily: "'Cinzel', serif" }} className="text-[16pt] font-extrabold uppercase tracking-wide">{l.text}</p>
                : l.kind === "motto"
                  ? <p key="m" style={{ fontFamily: t.body }} className="text-[11pt] italic">“{l.text}”</p>
                  : <p key="l" style={{ fontFamily: t.body }} className="text-[10pt]">{l.text}</p>)}
            </div>}
          </div>}
          {photoMode === "passport" && <div style={{ position: "absolute", top: "15mm", right: "20mm" }}><Photo p={data.photo} w={24} h={30} t={t} frame={photoFrame} /></div>}
          <div className="mt-[4mm] flex items-center gap-3">
          {kind === "royalblue" && <Laurel color="#c8961e" />}
          <h1 style={{ fontFamily: f.heading || t.title, color: t.accent }} className={`leading-none ${kind === "modern" || kind === "young" || kind === "executive" || kind === "minimal" ? "text-[30pt] font-bold uppercase tracking-wider" : "text-[38pt]"}`}>
            {staff ? "Certificate of Recognition" : kind === "young" ? "Super Star Award" : "Certificate of Award"}
          </h1>
          {kind === "royalblue" && <Laurel color="#c8961e" flip />}
          </div>
          <div className={`mt-[5mm] flex w-full flex-1 items-center gap-[8mm] ${portrait ? "flex-col justify-start" : "justify-center"}`}>
            {full && <Photo p={data.photo} w={46} h={portrait ? 56 : 58} t={t} frame={photoFrame} />}
            {text}
          </div>
          <div className="grid w-full grid-cols-3 items-end gap-6 text-[11pt]" style={{ fontFamily: t.body }}>
            <div>{d.leftSignature && data.leftSigner && <>
              {data.leftSignature ? <img src={data.leftSignature} alt="" className="mx-auto h-[14mm] object-contain" /> : <div className="h-[14mm]" />}
              <p className="border-t pt-1" style={{ borderColor: t.ink }}>{data.leftSigner}</p></>}</div>
            <div className="flex flex-col items-center">
              {d.seal && (school.stamp ? <img src={school.stamp} alt="" className="h-[22mm] object-contain" /> : <Seal t={t} label="EXCELLENCE" medallion={medallion} crest={school.logo} />)}
              {d.date && data.date && <p className="mt-1">{data.date}</p>}
            </div>
            <div>{d.rightSignature && <>
              {school.signature ? <img src={school.signature} alt="" className="mx-auto h-[14mm] object-contain" /> : <div className="h-[14mm]" />}
              <p className="border-t pt-1" style={{ borderColor: t.ink }}>{data.rightSigner ?? "Headteacher"}{data.rightName ? ` – ${data.rightName}` : ""}</p></>}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
