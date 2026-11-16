import { useEffect, useRef, useState } from "react";
import { Award, CalendarCheck, ChevronLeft, ChevronRight, CloudOff, FileText, GraduationCap, HelpCircle, MessageCircle, ScanLine, Wallet } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type Slide = { icon: LucideIcon; title: string; tagline: string; points: string[] };

export const FEATURE_SLIDES: Slide[] = [
  { icon: FileText, title: "Official GES Terminal Report Cards", tagline: "Neat A4 reports for KG 1 to Basic 9", points: ["SBA 50 + Exam 50 scaled automatically", "Grades 1–9, positions and Basic 7–9 Best Six", "Print or save the whole class as PDF"] },
  { icon: MessageCircle, title: "Instant WhatsApp & SMS Sharing", tagline: "Reach parents wherever they are", points: ["Send each learner's results to the parent's WhatsApp", "Use SMS when the number is not on WhatsApp", "No travel needed to collect results"] },
  { icon: ScanLine, title: "Snap & Scan Class Register", tagline: "Add your whole class in seconds", points: ["Take a photo of your paper register", "Names are read in for you to check and correct", "Class limits and duplicates are checked before saving"] },
  { icon: GraduationCap, title: "Automatic End-of-Year Promotion", tagline: "Never retype learner names again", points: ["Promoted learners move up to the next class in one step", "Parent numbers, details and streams carry forward", "Only register new learners each year"] },
  { icon: CalendarCheck, title: "Daily Attendance Register", tagline: "Mark the whole class in one tap", points: ["Monthly GES register from Crèche to Basic 9", "Boys, girls and total counts every day", "Fill days present on report cards automatically"] },
  { icon: HelpCircle, title: "Questions & Answers Hub", tagline: "Fresh practice for every class", points: ["KG 1 to Basic 9 objectives and written questions", "WAEC-style Section B for English and Ghanaian Languages", "New Mathematics questions every time"] },
  { icon: Award, title: "Awards & Certificates Studio", tagline: "Beautiful certificates in minutes", points: ["Print in A4, A3, A2 or custom sizes", "Headteacher, SISO and District Director signatures", "Learner and staff awards with your school name"] },
  { icon: Wallet, title: "Account Office & Fees", tagline: "Daily fees made simple", points: ["Tuition, feeding and custom bus fares", "See paid and unpaid learners at a glance", "Parent reminders on WhatsApp"] },
  { icon: CloudOff, title: "Works Offline & School Cloud", tagline: "No data bundle? No problem", points: ["Keep working without internet", "Saves to your school cloud once you are back online", "Every teacher in the school stays in sync"] },
];

const ROTATE_MS = 5500;

export function FeatureShowcase() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [dir, setDir] = useState<1 | -1>(1);
  const [reduced, setReduced] = useState(false);
  const touchX = useRef<number | null>(null);
  const count = FEATURE_SLIDES.length;
  const go = (i: number) => setIndex(((i % count) + count) % count);

  useEffect(() => {
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  useEffect(() => {
    if (paused || reduced) return;
    const id = window.setTimeout(() => { setDir(1); setIndex((i) => (i + 1) % count); }, ROTATE_MS);
    return () => window.clearTimeout(id);
  }, [paused, reduced, count, index]);

  const slide = (FEATURE_SLIDES[index] ?? FEATURE_SLIDES[0]) as Slide;
  const Icon = slide.icon;
  const manual = (i: number) => { setPaused(true); setDir(i < index ? -1 : 1); go(i); };

  return (
    <section aria-roledescription="carousel" aria-label="What EduReport does" className="mx-auto w-full max-w-3xl px-5">
      <h2 className="text-center font-display text-2xl font-bold text-foreground">What EduReport does for your school</h2>
      <div
        className="relative mt-5 overflow-hidden rounded-xl border border-primary/25 bg-card shadow-sm"
        onTouchStart={(e) => { touchX.current = e.touches[0]?.clientX ?? null; }}
        onTouchEnd={(e) => {
          const start = touchX.current; touchX.current = null;
          const end = e.changedTouches[0]?.clientX;
          if (start == null || end == null || Math.abs(end - start) < 40) return;
          manual(end < start ? index + 1 : index - 1);
        }}
      >
        {!paused && !reduced && (
          <div aria-hidden className="absolute inset-x-0 top-0 z-10 h-1 bg-primary-foreground/20">
            <div key={`bar-${index}`} className="h-full origin-left bg-accent" style={{ animation: `showcase-progress ${ROTATE_MS}ms linear forwards` }} />
          </div>
        )}
        <div key={index} aria-live={paused ? "polite" : "off"} className={`animate-in fade-in duration-500 ease-out motion-reduce:animate-none ${dir === 1 ? "slide-in-from-right-12" : "slide-in-from-left-12"}`}>
          <div className="flex items-center gap-3 bg-primary px-5 py-4 text-primary-foreground">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-foreground/15 animate-in zoom-in-50 spin-in-12 duration-700 motion-reduce:animate-none"><Icon className="h-6 w-6" aria-hidden /></span>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-primary-foreground/80">{index + 1} of {count}</p>
              <h3 className="font-display text-lg font-bold leading-tight">{slide.title}</h3>
            </div>
          </div>
          <div className="min-h-[11.5rem] px-5 py-4">
            <p className="font-semibold text-primary animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-500 motion-reduce:animate-none" style={{ animationDelay: "120ms" }}>{slide.tagline}</p>
            <ul className="mt-3 space-y-2 text-sm text-foreground">
              {slide.points.map((p, i) => (
                <li key={p} className="flex gap-2 animate-in fade-in slide-in-from-bottom-3 fill-mode-both duration-500 motion-reduce:animate-none" style={{ animationDelay: `${220 + i * 120}ms` }}>
                  <span aria-hidden className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />{p}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="flex items-center justify-between border-t border-border px-3 py-2">
          <button type="button" onClick={() => manual(index - 1)} aria-label="Previous feature" className="flex h-10 w-10 items-center justify-center rounded-full text-primary hover:bg-primary/10"><ChevronLeft /></button>
          <div className="flex flex-wrap justify-center gap-1.5">
            {FEATURE_SLIDES.map((s, i) => (
              <button key={s.title} type="button" onClick={() => manual(i)} aria-label={`Show ${s.title}`} aria-current={i === index} className={`h-2.5 rounded-full transition-all ${i === index ? "w-6 bg-primary" : "w-2.5 bg-primary/25"}`} />
            ))}
          </div>
          <button type="button" onClick={() => manual(index + 1)} aria-label="Next feature" className="flex h-10 w-10 items-center justify-center rounded-full text-primary hover:bg-primary/10"><ChevronRight /></button>
        </div>
      </div>
    </section>
  );
}
