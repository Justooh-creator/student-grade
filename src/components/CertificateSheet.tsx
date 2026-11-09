import type { School } from "@/lib/store";
import { useId } from "react";
import { DEFAULT_DISPLAY, DEFAULT_MEDALLION, EMBLEM_HEIGHT_MM, certificateTextPoints, headerLines, certificateSession, certificatePresentation, type CertTheme, type CertDisplay, type Medallion, type PhotoFrame, type CertFonts, type CertTextSizes } from "@/lib/certificates";

export type PhotoAdjust = { src: string; zoom: number; x: number; y: number };
export type CertData = {
  recipient: "learner" | "staff";
  name: string;
  /** Learner: class name. Staff: position / designation. */
  line1: string;
  /** Staff: subject / department. */
  line2?: string | undefined;
  award: string; citation: string; date: string;
  occasion: string;
  heading?: string;
  leftSigner: string | null; leftName?: string; leftSignature?: string;
  rightSignature?: string;
  rightSigner?: string | undefined; rightName?: string | undefined;
  photo?: PhotoAdjust | undefined;
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

/** Fully vector artwork, including the curved name: no external image or font dependency. */
function SchoolRosette({ name }: { name: string }) {
  const id = useId().replace(/:/g, "");
  const gold = `${id}-gold`, arc = `${id}-arc`;
  const label = name.trim().toUpperCase() || "SCHOOL NAME";
  const petals = Array.from({ length: 96 }, (_, i) => {
    const a = i * Math.PI / 48 - Math.PI / 2;
    const r = 43 + 3 * Math.cos(i * Math.PI / 2);
    return `${50 + r * Math.cos(a)},${48 + r * Math.sin(a)}`;
  }).join(" ");
  return <svg data-cert="emblem" className="certificate-emblem" viewBox="0 0 100 125" width="32mm" height="40mm" role="img" aria-label={`Gold rosette with ${label}`}>
    <defs>
      <linearGradient id={gold} x1="0" y1="0" x2="1" y2="1">
        <stop stopColor="var(--certificate-gold-shadow)" /><stop offset=".3" stopColor="var(--certificate-gold-light)" /><stop offset=".5" stopColor="var(--certificate-gold-shine)" /><stop offset=".7" stopColor="var(--certificate-gold)" /><stop offset="1" stopColor="var(--certificate-gold-shadow)" />
      </linearGradient>
      <path id={arc} d="M19 51 A31 31 0 0 1 81 51" />
    </defs>
    <g stroke="var(--certificate-gold-light)" strokeWidth="1.3">
      <path d="M28 71 L13 119 L30 111 L39 124 L53 78Z" fill="var(--certificate-ribbon)" />
      <path d="M49 78 L62 124 L71 111 L88 119 L73 71Z" fill="var(--certificate-ribbon-shadow)" />
      <path d="M31 84 L23 111 M68 84 L77 111" fill="none" />
    </g>
    <polygon points={petals} fill={`url(#${gold})`} stroke="var(--certificate-gold-shadow)" strokeWidth=".65" />
    <circle cx="50" cy="48" r="37" fill="var(--certificate-gold-light)" stroke="var(--certificate-gold-shine)" strokeWidth="1.2" />
    <circle cx="50" cy="48" r="34" fill="var(--certificate-gold-shine)" stroke="var(--certificate-gold-shadow)" strokeWidth=".6" />
    <text fill="var(--certificate-ribbon-shadow)" fontFamily="Georgia, serif" fontWeight="bold" fontSize={label.length > 42 ? 4 : label.length > 27 ? 5 : 6} letterSpacing="0">
      <textPath href={`#${arc}`} startOffset="50%" textAnchor="middle" textLength={label.length > 27 ? 91 : undefined} lengthAdjust="spacingAndGlyphs">{label}</textPath>
    </text>
    <g fill="none" stroke="var(--certificate-gold-shadow)" strokeWidth="1">
      <path d="M46 73 Q24 65 28 43 M54 73 Q76 65 72 43" />
      {Array.from({ length: 5 }, (_, i) => <g key={i}><ellipse cx={30 + i * 2.4} cy={46 + i * 5} rx="2" ry="4" transform={`rotate(-40 ${30 + i * 2.4} ${46 + i * 5})`} fill="var(--certificate-gold)" /><ellipse cx={70 - i * 2.4} cy={46 + i * 5} rx="2" ry="4" transform={`rotate(40 ${70 - i * 2.4} ${46 + i * 5})`} fill="var(--certificate-gold)" /></g>)}
      <path d="M36 49 Q43 46 50 50 Q57 46 64 49 V64 Q57 61 50 65 Q43 61 36 64Z M50 50 V65 M39 53 Q44 51 47 54 M53 54 Q58 51 61 53 M39 58 Q44 56 47 59 M53 59 Q58 56 61 58" />
    </g>
    <Star cx={50} cy={39} r={6} fill="var(--certificate-gold-shadow)" />
  </svg>;
}

/** Edge-only additions preserve each template's original frame and content clearance. */
function BorderAccents({ kind, t, w, h }: { kind: CertTheme | "executive"; t: T; w: number; h: number }) {
  const x = 12, y = 12, right = w - 12, bottom = h - 12;
  const geometric = ["modern", "minimal", "platinum", "executive"].includes(kind);
  const ornament = <g fill="none" stroke="currentColor" strokeWidth=".35">
    {geometric ? <><path d="M0 15 V4 L4 0 H15 M3 15 V6 L6 3 H15" /><path d="M1 1 L9 9 M9 1 L1 9" opacity=".45" /></>
      : kind === "young" ? <><Star cx={5} cy={5} r={3} fill="currentColor" /><path d="M0 13 Q4 9 8 13 T16 13" /></>
      : kind === "african" ? <><path d="M2 2 L9 2 L9 9 L2 9Z M4 4 L7 4 L7 7 L4 7Z M12 1 V12 H1" /><path d="M15 3 Q10 5 15 8 Q20 5 15 3 M3 15 Q5 10 8 15 Q5 20 3 15" /></>
      : <><path d="M0 16 C8 13 1 5 8 5 S16 0 16 0 M0 0 C2 8 9 1 9 9 S17 12 17 17 M1 1 Q14 1 14 14 Q1 14 1 1Z" /><path d="M3 8 Q8 3 11 8 Q8 12 3 8Z" /><circle cx="8" cy="8" r="1" fill="currentColor" /></>}
  </g>;
  return <svg data-decoration="border-accents" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="pointer-events-none absolute inset-0 h-full w-full" style={{ color: t.accent2 }} aria-hidden>
    <rect x="8.5" y="8.5" width={w - 17} height={h - 17} fill="none" stroke="currentColor" strokeWidth=".2" />
    {[[x,y,0],[right,y,90],[right,bottom,180],[x,bottom,270]].map(([cx,cy,r], i) => <g key={i} transform={`translate(${cx} ${cy}) rotate(${r})`}>{ornament}</g>)}
    {[y - 3, bottom + 3].map((cy, i) => <g key={i} transform={`translate(${w / 2} ${cy})`} fill="none" stroke="currentColor" strokeWidth=".3"><path d="M-20 0 H-5 M5 0 H20 M-3 0 L0 -1.6 L3 0 L0 1.6Z" />{!geometric && <path d="M-15 0 Q-10 -3 -5 0 M5 0 Q10 3 15 0" />}</g>)}
  </svg>;
}

function AcademicEmblem({ medallion, crest }: { medallion: Medallion; crest?: string }) {
  if (medallion === "none") return null;
  return <svg data-cert="emblem" className="certificate-emblem" viewBox="0 0 100 100" style={{ width: `${EMBLEM_HEIGHT_MM}mm`, height: `${EMBLEM_HEIGHT_MM}mm` }} role="img" aria-label={`${medallion} in gold laurel wreath`}>
    {[false, true].map((mirror) => <g key={String(mirror)} transform={mirror ? "translate(100 0) scale(-1 1)" : undefined}>
      <path d="M49 91 C22 83 13 53 24 25 Q28 15 35 10" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      {Array.from({ length: 9 }, (_, i) => {
        const a = (128 + i * 13) * Math.PI / 180;
        const x = 50 + 31 * Math.cos(a), y = 49 + 38 * Math.sin(a);
        return <g key={i} transform={`translate(${x} ${y}) rotate(${-42 + i * 12})`}>
          <path d="M0 0 Q-13 -2 -12 -12 Q-1 -12 0 0Z" fill="currentColor" />
          <path d="M0 0 Q11 -2 10 -10 Q0 -9 0 0Z" fill="var(--certificate-gold-light)" />
        </g>;
      })}
    </g>)}
    <path d="M42 92 Q50 86 58 92 M50 89 l-4 7 M50 89 l4 7" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    {medallion === "crest" && crest ? <image href={crest} x="35" y="32" width="30" height="32" preserveAspectRatio="xMidYMid meet" />
      : medallion === "crest" ? <path d="M37 31 H63 V48 Q63 61 50 68 Q37 61 37 48Z M43 38 H57" fill="none" stroke="currentColor" strokeWidth="1.5" />
      : medallion === "trophy" ? <g fill="currentColor"><path d="M38 33 H62 V43 Q62 56 50 56 Q38 56 38 43Z" /><path d="M38 37 H32 V41 Q32 49 40 49 M62 37 H68 V41 Q68 49 60 49" fill="none" stroke="currentColor" strokeWidth="2" /><path d="M48 55 H52 V65 H60 V68 H40 V65 H48Z" /></g>
      : <Star cx={50} cy={48} r={15} fill="currentColor" />}
  </svg>;
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

function Ribbons({ portrait }: { portrait: boolean }) {
  const dimensions = { width: portrait ? "58mm" : "85mm", height: portrait ? "23mm" : "30mm" };
  return (<>
    <svg data-decoration="ribbon-top" viewBox="0 0 300 120" preserveAspectRatio="none" aria-hidden style={{ position: "absolute", top: 0, left: 0, ...dimensions }}>
      <defs><linearGradient id="rb-gold" x1="0" x2="1"><stop offset="0" stopColor="#b8860b" /><stop offset=".45" stopColor="#f5d061" /><stop offset=".55" stopColor="#fff6c8" /><stop offset="1" stopColor="#c8961e" /></linearGradient></defs>
      <path d="M0 0 H300 Q180 20 110 60 T0 115 Z" fill="#0a2558" />
      <path d="M0 0 H230 Q150 22 95 52 T0 92 Z" fill="#1e3a8a" />
      <path d="M0 98 Q60 80 110 62 T300 2 L300 8 Q190 30 116 70 T0 106 Z" fill="url(#rb-gold)" />
    </svg>
    <svg data-decoration="ribbon-bottom" viewBox="0 0 300 120" preserveAspectRatio="none" aria-hidden style={{ position: "absolute", bottom: 0, right: 0, ...dimensions, transform: "rotate(180deg)" }}>
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
export function CertificateSheet({ data, school, theme, watermark, photoMode = "none", size = { w: 297, h: 210 }, display = DEFAULT_DISPLAY, medallion = DEFAULT_MEDALLION, frame: photoFrame = "rect", fonts, textSizes }: {
  data: CertData; school: School; theme: CertTheme; watermark: boolean; photoMode?: PhotoMode; size?: { w: number; h: number };
  display?: CertDisplay; medallion?: Medallion; frame?: PhotoFrame; fonts?: Partial<CertFonts>; textSizes?: Partial<CertTextSizes>;
}) {
  const d = display;
  const f = { heading: fonts?.heading || "", name: fonts?.name || "", award: fonts?.award || "", citation: fonts?.citation || "" };
  const lines = headerLines(school, d);
  const kind = theme === "young" && data.recipient === "staff" ? "executive" : theme;
  const t = THEME[kind];
  const portrait = size.h > size.w;
  const points = (element: keyof CertFonts) => `${certificateTextPoints(element, portrait, textSizes?.[element])}pt`;
  const baseW = portrait ? 210 : 297;
  const baseH = (baseW * size.h) / size.w;
  const zoom = size.w / baseW;
  const staff = data.recipient === "staff";
  const full = photoMode === "full";
  const heading = data.heading?.trim() || (staff ? "Certificate of Recognition" : kind === "young" ? "Super Star Award" : "Certificate of Award");
  const session = certificateSession(school.term, school.academicYear, d);
  const frame = theme === "royalblue" ? `1.8mm solid #d4a017` : theme === "grand" ? `double 3mm ${t.accent2}` : theme === "minimal" ? `0.4mm solid ${t.accent2}` : theme === "royal" || theme === "elite" || theme === "emerald" ? `double 2.4mm ${t.accent}` : theme === "young" ? `1.6mm dashed ${t.accent2}` : `1.4mm solid ${t.accent}`;
  const cornerSize = theme === "young" ? "30mm" : "26mm";
  const corner = (r: number, pos: React.CSSProperties) => <Corner t={t} kind={kind} style={{ position: "absolute", width: cornerSize, height: cornerSize, transform: `rotate(${r}deg)`, ...pos }} />;

  const text = (
    <div className="flex flex-1 flex-col items-center text-center" style={{ minWidth: 0 }}>
      <p style={{ fontFamily: t.body }} className="text-[14pt] italic">{certificatePresentation(heading)}</p>
      <p data-cert="recipient" style={{ fontFamily: f.name || t.name, fontSize: points("name"), borderColor: t.accent2, color: kind === "royalblue" ? "#0a2558" : undefined }} className={`mt-[2mm] max-w-full break-words border-b-2 px-2 leading-tight ${t.name.includes("cursive") ? "font-normal" : "font-bold"}`}>{data.name || (staff ? "Staff Name" : "Learner Name")}</p>
      {d.className && <p style={{ fontFamily: t.body }} className="mt-[2mm] text-[13pt]">{staff ? [data.line1, data.line2].filter(Boolean).join(" · ") : data.line1 ? `of ${data.line1}` : ""}</p>}
      <p data-cert="award" style={{ fontFamily: f.award || (kind === "modern" || kind === "young" || kind === "minimal" ? t.title : "'Cinzel', serif"), fontSize: points("award"), color: kind === "royalblue" ? "#b8860b" : t.accent }} className="mt-[4mm] max-w-full break-words font-extrabold uppercase">{data.award}</p>
      {d.citation && data.citation && <p data-cert="citation" style={{ fontFamily: f.citation || t.body, fontSize: points("citation") }} className="mt-[2mm] max-w-[200mm] italic">{data.citation}</p>}
      {session && <p data-cert="session" style={{ fontFamily: t.body }} className="mt-[1mm] text-[12pt]">{session}</p>}
    </div>);

  return (
    <div className="certificate-page relative mx-auto overflow-hidden" style={{ width: `${size.w}mm`, height: `${size.h}mm`, background: t.bg, color: t.ink, breakAfter: "page" }}>
      <div style={{ width: `${baseW}mm`, height: `${baseH}mm`, zoom, position: "relative" }}>
        <div aria-hidden style={{ position: "absolute", inset: "6mm", border: frame }} />
        <div aria-hidden style={{ position: "absolute", inset: "10mm", border: `0.4mm solid ${t.accent2}` }} />
        <BorderAccents kind={kind} t={t} w={baseW} h={baseH} />
        {corner(0, { top: "4mm", left: "4mm" })}{corner(90, { top: "4mm", right: "4mm" })}
        {corner(270, { bottom: "4mm", left: "4mm" })}{corner(180, { bottom: "4mm", right: "4mm" })}
        {d.watermarkBg && <div aria-hidden style={{ position: "absolute", inset: "10mm", opacity: t.dark ? 0.08 : 0.06, backgroundImage: `repeating-radial-gradient(circle at 50% 50%, ${t.accent} 0 0.3mm, transparent 0.3mm 2.2mm)` }} />}
        {kind === "royalblue" && <Ribbons portrait={portrait} />}
        {kind === "african" && <><Kente pos={{ top: "8mm" }} /><Kente pos={{ bottom: "8mm" }} /></>}
        {theme === "young" && !staff && <YoungArt />}
        {watermark && (
          <div aria-hidden className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
            <span className="-rotate-[25deg] whitespace-nowrap border-4 px-6 py-2 text-[22pt] font-black tracking-wider" style={{ color: "rgba(200,30,30,.32)", borderColor: "rgba(200,30,30,.32)" }}>
              UNOFFICIAL PREVIEW • LICENSE REQUIRED TO PRINT
            </span>
          </div>
        )}
        <div data-cert="content" className="relative z-10 flex h-full flex-col items-center text-center" style={{ padding: kind === "african" ? "22mm 24mm 22mm" : kind === "royalblue" ? "24mm 24mm 24mm" : "18mm 22mm", overflowWrap: "anywhere", letterSpacing: 0 }}>
          {(lines.length > 0 || (d.logo && school.logo)) && <div className={`flex w-full shrink-0 items-center justify-center gap-4 ${portrait ? "flex-col gap-1" : ""}`}>
            {d.logo && school.logo && <img src={school.logo} alt="School logo" className="h-[20mm] w-[20mm] object-contain" />}
            {lines.length > 0 && <div className="max-w-[170mm]">
              {lines.map((l) => l.kind === "name"
                ? <p key="n" style={{ fontFamily: "'Cinzel', serif" }} className="text-[16pt] font-extrabold uppercase tracking-wide">{l.text}</p>
                : l.kind === "motto"
                  ? <p key="m" style={{ fontFamily: t.body }} className="text-[11pt] italic">“{l.text}”</p>
                  : <p key="l" style={{ fontFamily: t.body }} className="text-[10pt]">{l.text}</p>)}
            </div>}
          </div>}
          <div className="mt-[4mm] flex w-full shrink-0 items-center justify-center gap-3">
          {kind === "royalblue" && <Laurel color="#c8961e" />}
          <h1 data-cert="heading" style={{ fontFamily: f.heading || t.title, fontSize: points("heading"), color: t.accent, letterSpacing: 0 }} className="min-w-0 break-words leading-tight">
            {heading}
          </h1>
          {kind === "royalblue" && <Laurel color="#c8961e" flip />}
          </div>
          <div data-cert="body" className={`my-[4mm] flex w-full flex-1 items-center gap-[6mm] ${portrait ? "flex-col justify-center" : "justify-center"}`}>
            {photoMode !== "none" && <Photo p={data.photo} w={full ? portrait ? 68 : 62 : 35} h={full ? portrait ? 85 : 78 : 45} t={t} frame={photoFrame} />}
            {text}
          </div>
          <div data-cert="footer" className="grid w-full shrink-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-end gap-[4mm] text-[11pt]" style={{ fontFamily: t.body }}>
            <div data-cert="left-signature" className="min-w-0">{d.leftSignature && data.leftSigner && <>
              {data.leftSignature ? <img src={data.leftSignature} alt="" className="mx-auto h-[14mm] object-contain" /> : <div className="h-[14mm]" />}
              <div className="border-t pt-1" style={{ borderColor: t.ink }}>
                {data.leftName && <p className="break-words font-bold leading-tight">{data.leftName}</p>}
                <p className="mt-1 leading-tight">{data.leftSigner}</p>
              </div></>}</div>
            <div data-cert="award-centre" className="flex flex-col items-center">
              {d.seal && (medallion === "rosette" ? <SchoolRosette name={school.name} /> : <AcademicEmblem medallion={medallion} crest={school.logo} />)}
              {d.seal && school.stamp && <img data-cert="stamp" src={school.stamp} alt="School stamp" className="mt-[2mm] h-[18mm] max-w-[28mm] object-contain" />}
              {d.date && data.date && <p className="mt-1">{data.date}</p>}
            </div>
            <div data-cert="right-signature" className="min-w-0">{d.rightSignature && <>
              {(data.rightSignature ?? school.signature) ? <img src={data.rightSignature ?? school.signature} alt="" className="mx-auto h-[14mm] max-w-full object-contain" /> : <div className="h-[14mm]" />}
              <div className="border-t pt-1" style={{ borderColor: t.ink }}>
                {data.rightName && <p className="break-words font-bold leading-tight">{data.rightName}</p>}
                <p className="mt-1 leading-tight">{data.rightSigner ?? "Headteacher"}</p>
              </div></>}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
