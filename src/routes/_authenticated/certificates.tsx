import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { CertificatePreview } from "@/components/CertificatePreview";
import { PrintButton } from "@/components/PaymentGate";
import { CertificateSheet, type CertData, type PhotoMode, type PhotoAdjust } from "@/components/CertificateSheet";
import { useAppData } from "@/lib/store";
import { useUser } from "@/lib/auth";
import { useLicense } from "@/lib/license";
import { useCloud } from "@/lib/cloud";
import { getClassLevel, schoolClassIds, type ClassId } from "@/lib/ges";
import {
  CERT_HEADINGS, AWARD_PRESETS, STAFF_AWARD_PRESETS, CERT_THEMES, POSITION_AWARD, DEFAULT_DISPLAY, DISPLAY_LABELS, SIGNER_PRESETS, MEDALLIONS,
  PHOTO_FRAMES, FONT_CHOICES, PAPERS, DEFAULT_MEDALLION, DEFAULT_TEXT_SIZES, TEXT_SIZE_CHOICES, defaultCitation, defaultStaffCitation, topLearners, signerTitles, certificateSignerDefaults, paperSize, canMakeCertificates,
  type CertTheme, type CertDisplay, type SignerPreset, type Medallion, type PhotoFrame, type PaperId, type CertFonts, type CertTextSizes,
} from "@/lib/certificates";

export const Route = createFileRoute("/_authenticated/certificates")({
  head: () => ({ meta: [
    { title: "Awards & Certificates — EduReport Ghana" },
    { name: "description", content: "Design and print premium award certificates for learners and staff." },
    { property: "og:title", content: "Awards & Certificates — EduReport Ghana" },
    { property: "og:description", content: "Beautiful school award certificates with different font styles." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex, nofollow" },
  ] }),
  component: CertificatesPage,
});

const input = "h-10 w-full rounded-md border border-input bg-background px-3 text-sm";

function CertificatesPage() {
  const { school, students } = useAppData();
  const { user } = useUser();
  const cloud = useCloud();
  const lic = useLicense(user?.id);
  const [recipient, setRecipient] = useState<"learner" | "staff">("learner");
  const [classId, setClassId] = useState<ClassId>("b4");
  const [theme, setTheme] = useState<CertTheme>("royalblue");
  const [mode, setMode] = useState<"single" | "top3">("single");
  const [studentId, setStudentId] = useState("");
  const [award, setAward] = useState<string>(AWARD_PRESETS[0]);
  const [custom, setCustom] = useState("");
  const [heading, setHeading] = useState("Certificate of Award");
  const [customHeading, setCustomHeading] = useState("");
  const [citation, setCitation] = useState("");
  const [staffName, setStaffName] = useState("");
  const [staffPos, setStaffPos] = useState("");
  const [staffDept, setStaffDept] = useState("");
  const [date, setDate] = useState(new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }));
  const [display, setDisplay] = useState<CertDisplay>(DEFAULT_DISPLAY);
  const [signers, setSigners] = useState<SignerPreset>("ct_ht");
  const [customSigners, setCustomSigners] = useState({ left: "", right: "" });
  const [signerEdits, setSignerEdits] = useState<Record<string, { name?: string; signature?: string }>>({});
  const [medallion, setMedallion] = useState<Medallion>(DEFAULT_MEDALLION);
  const [photoMode, setPhotoMode] = useState<PhotoMode>("none");
  const [frame, setFrame] = useState<PhotoFrame>("rect");
  const [photo, setPhoto] = useState<PhotoAdjust>({ src: "", zoom: 1, x: 0, y: 0 });
  const [fonts, setFonts] = useState<CertFonts>({ heading: "", name: "", award: "", citation: "" });
  const [textSizes, setTextSizes] = useState<CertTextSizes>(DEFAULT_TEXT_SIZES);
  const [paper, setPaper] = useState<PaperId>("A4");
  const [orientation, setOrientation] = useState<"landscape" | "portrait">("landscape");
  const [customSize, setCustomSize] = useState({ w: 297, h: 210, unit: "mm" as "mm" | "in" });

  const inSchool = !!cloud.schoolId;
  if (cloud.status !== "loading" && !canMakeCertificates(inSchool, cloud.role)) {
    return <div className="min-h-screen bg-background">
      <AppHeader schoolName={school.name} term={school.term} year={school.academicYear} activeClass={classId} />
      <main className="mx-auto max-w-xl px-4 py-10 text-center">
        <h1 className="font-display text-2xl font-bold">Awards & Certificates</h1>
        <p className="mt-3 text-muted-foreground">Only the Headteacher, Assistant Headteacher or School Admin can create certificates for this school. Please ask them to issue the award.</p>
      </main>
    </div>;
  }

  const staff = recipient === "staff";
  const className = getClassLevel(classId).name;
  const inClass = students.filter((s) => s.classId === classId);
  const awardTitle = award === "Custom Award" ? custom || "Special Award" : award;
  const titles = signerTitles(signers, customSigners);
  const defaults = certificateSignerDefaults(school, classId, signers);
  const leftKey = `${signers}:${classId}:left`;
  const rightKey = `${signers}:right`;
  const leftName = signerEdits[leftKey]?.name ?? defaults.leftName;
  const rightName = signerEdits[rightKey]?.name ?? defaults.rightName;
  const leftSignature = signerEdits[leftKey]?.signature ?? defaults.leftSignature;
  const rightSignature = signerEdits[rightKey]?.signature ?? school.signature;
  const editSigner = (key: string, value: { name?: string; signature?: string }) => setSignerEdits((old) => ({ ...old, [key]: { ...old[key], ...value } }));
  const uploadSignature = (key: string, file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => editSigner(key, { signature: String(reader.result) });
    reader.readAsDataURL(file);
  };
  const occasion = `${school.term} · ${school.academicYear} Academic Year`;
  const size = paperSize(paper, orientation, customSize);
  const chosen = inClass.find((s) => s.id === studentId);
  const photoFor = (src?: string): PhotoAdjust | undefined => photo.src ? photo : src ? { src, zoom: photo.zoom, x: photo.x, y: photo.y } : undefined;
  const base = { heading: heading === "Custom Heading" ? customHeading : heading, date, occasion, leftSigner: titles.left, rightSigner: titles.right, leftName, rightName, leftSignature, rightSignature };

  const certs: CertData[] = staff
    ? [{ ...base, recipient: "staff", name: staffName, line1: staffPos, line2: staffDept, award: awardTitle, citation: citation || defaultStaffCitation(awardTitle), photo: photo.src ? photo : undefined }]
    : mode === "top3"
      ? topLearners(students, classId).map(({ student, position }) => ({
          ...base, recipient: "learner" as const, name: student.name, line1: className, award: POSITION_AWARD[position] ?? "",
          citation: citation || defaultCitation("Position"), photo: photoFor((student as { photo?: string }).photo) }))
      : [{ ...base, recipient: "learner", name: chosen?.name ?? "", line1: className, award: awardTitle, citation: citation || defaultCitation(awardTitle), photo: photoFor((chosen as { photo?: string } | undefined)?.photo) }];

  const onPhoto = (file?: File) => {
    if (!file) return;
    const r = new FileReader();
    r.onload = () => setPhoto({ src: String(r.result), zoom: 1, x: 0, y: 0 });
    r.readAsDataURL(file);
  };
  const switchRecipient = (r: "learner" | "staff") => {
    setHeading(r === "staff" ? "Certificate of Recognition" : "Certificate of Award");
    setRecipient(r); setAward(r === "staff" ? STAFF_AWARD_PRESETS[0] : AWARD_PRESETS[0]); setCitation("");
    setSigners(r === "staff" ? "prop_ht" : "ct_ht"); setPhoto({ src: "", zoom: 1, x: 0, y: 0 });
  };
  const presets = staff ? STAFF_AWARD_PRESETS : AWARD_PRESETS;
  const fontField = (k: keyof CertFonts, label: string) => <div className="space-y-2">
    <label className="block text-sm font-semibold">{label}
    <select className={input} aria-label={`${label} font`} value={fonts[k]} onChange={(e) => setFonts({ ...fonts, [k]: e.target.value })}>
      {FONT_CHOICES.map((f) => <option key={f.label} value={f.id}>{f.label}</option>)}
    </select></label>
    <div role="group" aria-label={`${label} size`} className="grid grid-cols-2 gap-1">
      {TEXT_SIZE_CHOICES.map((s) => <Button key={s.value} size="sm" variant={textSizes[k] === s.value ? "default" : "outline"} aria-pressed={textSizes[k] === s.value} onClick={() => setTextSizes((old) => ({ ...old, [k]: s.value }))}>{s.label}</Button>)}
    </div>
  </div>;

  return <div className="min-h-screen bg-background pb-8">
    <style>{`@media print { @page certificate { size: ${size.w}mm ${size.h}mm; margin: 0; } }`}</style>
    <AppHeader schoolName={school.name} term={school.term} year={school.academicYear} activeClass={classId} />
    <main className="certificate-workspace mx-auto w-full max-w-[1800px] px-4 lg:px-6">
      <div className="certificate-editor-grid grid min-w-0 gap-6 lg:grid-cols-[minmax(320px,380px)_minmax(0,1fr)]">
      <div className="certificate-controls no-print min-w-0 space-y-4 py-4">
        <h1 className="font-display text-2xl font-bold">Awards & Certificates</h1>
        <div className="grid grid-cols-2 gap-2 [&>button]:min-w-0 [&>button]:whitespace-normal [&>button]:px-2 [&>button]:text-xs sm:[&>button]:text-sm">
          <Button onClick={() => switchRecipient("learner")} variant={!staff ? "default" : "outline"}>Learner award</Button>
          <Button onClick={() => switchRecipient("staff")} variant={staff ? "default" : "outline"}>Teacher / Staff award</Button>
        </div>

        <section className="space-y-2">
          <h2 className="font-semibold">Design</h2>
          <label className="block text-sm font-semibold">Certificate design
            <select className={input} value={theme} onChange={(e) => setTheme(e.target.value as CertTheme)}>
              {CERT_THEMES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
          </label>
        </section>

        {!staff && <>
          <label className="block text-sm font-semibold">Class
            <select className={input} value={classId} onChange={(e) => { setClassId(e.target.value as ClassId); setStudentId(""); }}>
              {schoolClassIds(school).map((id) => <option key={id} value={id}>{getClassLevel(id).name}</option>)}
            </select>
          </label>
          <div className="flex gap-2">
            <Button onClick={() => setMode("single")} variant={mode === "single" ? "default" : "outline"}>One learner</Button>
            <Button onClick={() => setMode("top3")} variant={mode === "top3" ? "default" : "outline"}>Top 3 in class (auto)</Button>
          </div>
        </>}

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
          <label className="text-sm font-semibold">Certificate heading
            <select className={input} value={heading} onChange={(e) => setHeading(e.target.value)}>
              {CERT_HEADINGS.map((h) => <option key={h}>{h}</option>)}
            </select>
          </label>
          {heading === "Custom Heading" && <label className="text-sm font-semibold">Custom heading
            <input className={input} value={customHeading} onChange={(e) => setCustomHeading(e.target.value)} />
          </label>}
          {staff && <>
            <label className="text-sm font-semibold">Staff name<input className={input} value={staffName} onChange={(e) => setStaffName(e.target.value)} /></label>
            <label className="text-sm font-semibold">Position / designation<input className={input} value={staffPos} onChange={(e) => setStaffPos(e.target.value)} placeholder="e.g. Class Teacher, Basic 4" /></label>
            <label className="text-sm font-semibold">Subject / department (optional)<input className={input} value={staffDept} onChange={(e) => setStaffDept(e.target.value)} /></label>
          </>}
          {!staff && mode === "single" && <label className="text-sm font-semibold">Learner
            <select className={input} value={studentId} onChange={(e) => setStudentId(e.target.value)}>
              <option value="">Choose learner…</option>
              {inClass.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select></label>}
          {(staff || mode === "single") && <label className="text-sm font-semibold">Award
            <select className={input} value={award} onChange={(e) => setAward(e.target.value)}>
              {presets.map((a) => <option key={a}>{a}</option>)}
            </select></label>}
          {(staff || mode === "single") && award === "Custom Award" && <label className="text-sm font-semibold">Award title
            <input className={input} value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="e.g. Best Reader" /></label>}
          <label className="text-sm font-semibold">Date<input className={input} value={date} onChange={(e) => setDate(e.target.value)} /></label>
          <label className="text-sm font-semibold sm:col-span-2 lg:col-span-1">Citation (optional)
            <input className={input} value={citation} onChange={(e) => setCitation(e.target.value)} placeholder="Leave blank to use the standard wording" /></label>
          <label className="text-sm font-semibold">Signatures
            <select className={input} value={signers} onChange={(e) => setSigners(e.target.value as SignerPreset)}>
              {SIGNER_PRESETS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
            </select></label>
          {signers === "custom" && <div className="grid grid-cols-2 gap-2">
            <label className="text-sm font-semibold">Left title<input className={input} value={customSigners.left} onChange={(e) => setCustomSigners({ ...customSigners, left: e.target.value })} /></label>
            <label className="text-sm font-semibold">Right title<input className={input} value={customSigners.right} onChange={(e) => setCustomSigners({ ...customSigners, right: e.target.value })} /></label>
          </div>}
          {([{ side: "Left", key: leftKey, name: leftName, signature: leftSignature, show: !!titles.left }, { side: "Right", key: rightKey, name: rightName, signature: rightSignature, show: true }]).filter((s) => s.show).map((s) => <div key={s.key} className="space-y-2">
            <label className="block text-sm font-semibold">{s.side} signer name
              <input className={input} value={s.name} onChange={(e) => editSigner(s.key, { name: e.target.value })} />
            </label>
            <label className="block text-sm">{s.side} signature (optional)
              <input aria-label={`${s.side} signature image`} type="file" accept="image/*" className="block w-full min-w-0 text-sm" onChange={(e) => uploadSignature(s.key, e.target.files?.[0])} />
            </label>
            {s.signature && <Button size="sm" variant="outline" onClick={() => editSigner(s.key, { signature: "" })}>Use manual signing</Button>}
          </div>)}
          <label className="text-sm font-semibold">Award emblem
            <select className={input} value={medallion} onChange={(e) => setMedallion(e.target.value as Medallion)}>
              {MEDALLIONS.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
            </select></label>
        </div>

        <details className="rounded-md border border-border p-3">
          <summary className="cursor-pointer font-semibold">Fonts & text sizes</summary>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {fontField("heading", "Heading")}{fontField("name", "Recipient name")}{fontField("award", "Award title")}{fontField("citation", "Citation")}
          </div>
        </details>

        <details className="rounded-md border border-border p-3">
          <summary className="cursor-pointer font-semibold">Photograph</summary>
          <div className="mt-3 space-y-3">
            <div className="flex flex-wrap gap-2">
              {(["none", "passport", "full"] as PhotoMode[]).map((m) => <Button key={m} onClick={() => setPhotoMode(m)} variant={photoMode === m ? "default" : "outline"}>
                {m === "none" ? "No photo" : m === "passport" ? "Passport" : "Large portrait"}</Button>)}
            </div>
            {photoMode !== "none" && <>
              <div className="flex flex-wrap gap-2">
                {PHOTO_FRAMES.map((p) => <Button key={p.id} onClick={() => setFrame(p.id)} variant={frame === p.id ? "default" : "outline"}>{p.label}</Button>)}
              </div>
              <p className="text-xs text-muted-foreground">{staff ? "Upload the staff photo." : "Uses the learner's saved photo, or upload a one-off photo."} Photos stay on this device only.</p>
              <div className="flex flex-wrap items-center gap-2">
                <label className="cursor-pointer rounded-md border border-border px-3 py-2 text-sm font-semibold">{photo.src ? "Replace photo" : "Upload photo"}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => onPhoto(e.target.files?.[0])} /></label>
                {photo.src && <Button onClick={() => setPhoto({ src: "", zoom: 1, x: 0, y: 0 })} className="rounded-md border border-border px-3 py-2 text-sm">Remove</Button>}
              </div>
              <div className="grid gap-2 sm:grid-cols-3">
                <label className="text-sm">Zoom<input type="range" min={1} max={3} step={0.05} value={photo.zoom} onChange={(e) => setPhoto({ ...photo, zoom: +e.target.value })} className="w-full" /></label>
                <label className="text-sm">Left / right<input type="range" min={-40} max={40} value={photo.x} onChange={(e) => setPhoto({ ...photo, x: +e.target.value })} className="w-full" /></label>
                <label className="text-sm">Up / down<input type="range" min={-40} max={40} value={photo.y} onChange={(e) => setPhoto({ ...photo, y: +e.target.value })} className="w-full" /></label>
              </div>
            </>}
          </div>
        </details>

        <details className="rounded-md border border-border p-3">
          <summary className="cursor-pointer font-semibold">Show / hide details</summary>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {DISPLAY_LABELS.map((o) => <label key={o.key} className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={display[o.key]} onChange={(e) => setDisplay({ ...display, [o.key]: e.target.checked })} />{o.label}
            </label>)}
          </div>
        </details>

        <details className="rounded-md border border-border p-3">
          <summary className="cursor-pointer font-semibold">Paper size: {paper === "custom" ? "Custom" : paper} {orientation}</summary>
          <div className="mt-3 flex flex-wrap gap-2">
            {([...Object.keys(PAPERS), "custom"] as PaperId[]).map((p) => <Button key={p} onClick={() => setPaper(p)} variant={paper === p ? "default" : "outline"}>{p === "custom" ? "Custom" : p}</Button>)}
            <Button onClick={() => setOrientation("landscape")} variant={orientation === "landscape" ? "default" : "outline"}>Landscape</Button>
            <Button onClick={() => setOrientation("portrait")} variant={orientation === "portrait" ? "default" : "outline"}>Portrait</Button>
          </div>
          {paper === "custom" && <div className="mt-3 grid grid-cols-3 gap-2">
            <label className="text-sm">Width<input type="number" className={input} value={customSize.w} onChange={(e) => setCustomSize({ ...customSize, w: +e.target.value })} /></label>
            <label className="text-sm">Height<input type="number" className={input} value={customSize.h} onChange={(e) => setCustomSize({ ...customSize, h: +e.target.value })} /></label>
            <label className="text-sm">Unit<select className={input} value={customSize.unit} onChange={(e) => setCustomSize({ ...customSize, unit: e.target.value as "mm" | "in" })}><option value="mm">mm</option><option value="in">inches</option></select></label>
          </div>}
        </details>

        {!staff && mode === "top3" && certs.length === 0 && <p className="text-sm text-muted-foreground">No marks entered for this class yet, so positions can't be worked out.</p>}
        {staff ? <PrintButton label="Print / Save certificates as PDF" /> : <PrintButton label="Print / Save certificates as PDF" classId={classId} />}
      </div>
      <CertificatePreview size={size}>
        {certs.map((c, i) => <CertificateSheet key={i} data={c} school={school} theme={theme} watermark={!lic.loading && !lic.canPrint}
          photoMode={photoMode} size={size} display={display} medallion={medallion} frame={frame} fonts={fonts} textSizes={textSizes} />)}
      </CertificatePreview>
      </div>
    </main>
  </div>;
}
