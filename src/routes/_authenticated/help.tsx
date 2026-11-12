import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export const Route = createFileRoute("/_authenticated/help")({
  head: () => ({
    meta: [
      { title: "Help & FAQs — EduReport Ghana" },
      { name: "description", content: "Answers to common EduReport questions: school cloud, offline work, data storage, photos, marks and support." },
      { property: "og:title", content: "Help & FAQs — EduReport Ghana" },
      { property: "og:description", content: "Quick answers for teachers and headteachers using EduReport." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: HelpPage,
});

type QA = { q: string; a: string };
const SECTIONS: { title: string; items: QA[] }[] = [
  { title: "🏫 School Cloud & Joining", items: [
    { q: "I registered, but I can't see my colleagues or our school's students. What happened?", a: "You probably created a new school instead of joining your headteacher's school. Open ☰ Menu → School Cloud and use “Joined the wrong school?” to switch." },
    { q: "How do I switch to my headteacher's school if I made a mistake?", a: "Go to ☰ Menu → School Cloud, scroll to “Joined the wrong school?”, type the headteacher's 6-character School Code and tap Switch school." },
    { q: "How can a new headteacher get student records 10 or 20 years later?", a: "Records belong to the school's cloud, not a teacher's phone. The new headteacher signs in and joins with the School Code, or the role is transferred under staff management. Also keep the backup file and Master Broadsheet PDFs each term." },
  ]},
  { title: "💾 Data Storage & Offline Work", items: [
    { q: "Where is our school's data saved?", a: "On your phone, so you can work without internet, and in the EduReport School Cloud, which updates automatically when you are online." },
    { q: "Does EduReport use a lot of mobile data?", a: "No. Work done offline uses no data. Syncing sends only small text changes such as names and marks." },
    { q: "What happens if two teachers enter marks for the same class at the same time?", a: "Both teachers' work is kept. Changes are saved box by box. If two people change the exact same box, the app asks you to review which one to keep." },
  ]},
  { title: "📷 Images, Logos, Stamps & Privacy", items: [
    { q: "Why didn't the logo, stamp or headteacher signature appear on my colleague's phone?", a: "Logos, stamps and signatures stay on the phone where they were uploaded, for privacy and to save data. Your colleague should upload them once under School Details on their own phone." },
    { q: "Are student photos uploaded to the internet?", a: "No. Learner photos stay on the phone that added them and are never sent to the cloud." },
    { q: "Why does the camera fail when scanning a class register?", a: "Allow camera access when your browser asks. If it still fails (common in some Android app versions), take the picture with your normal camera and choose Upload photo instead." },
  ]},
  { title: "📝 Marks, SBA & Classes", items: [
    { q: "Can I enter marks, attendance or view reports without internet?", a: "Yes. Everything works offline and syncs automatically once you are connected." },
    { q: "Why did my mark disappear and show a red warning?", a: "The mark was higher than the maximum for that column. The box is cleared to keep results correct. Type a valid mark and the warning goes away." },
    { q: "Why can't I add more than 35 learners to a class?", a: "EduReport follows the GES limit of 35 learners per class. For bigger classes, use separate streams (e.g. Basic 4 Stream 1 and Stream 2)." },
  ]},
  { title: "🔒 Remarks, Security & Support", items: [
    { q: "Why can't I type my own headteacher's remark?", a: "Only the headteacher or school admin can type custom headteacher remarks. Class teachers choose from the preloaded encouraging remarks." },
    { q: "How do I get help if I'm stuck?", a: "Chat with us on WhatsApp at 0530887628 or email support@edureportghana.com." },
  ]},
];

function HelpPage() {
  const [term, setTerm] = useState("");
  const t = term.trim().toLowerCase();
  const sections = SECTIONS.map((s) => ({ ...s, items: s.items.filter((i) => !t || (i.q + i.a).toLowerCase().includes(t)) })).filter((s) => s.items.length);
  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-3xl space-y-4 p-4">
        <div>
          <h1 className="text-2xl font-bold text-primary">Help & FAQs</h1>
          <p className="text-sm text-muted-foreground">Quick answers to common questions.</p>
        </div>
        <Input placeholder="Search questions…" value={term} onChange={(e) => setTerm(e.target.value)} />
        {sections.length === 0 && <p className="text-sm text-muted-foreground">No matching questions. Contact support below.</p>}
        {sections.map((s) => (
          <section key={s.title} className="rounded-lg border bg-card p-3">
            <h2 className="font-bold">{s.title}</h2>
            <Accordion type="multiple">
              {s.items.map((i) => (
                <AccordionItem key={i.q} value={i.q}>
                  <AccordionTrigger className="text-left text-sm">{i.q}</AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground">{i.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>
        ))}
        <a href="https://wa.me/233530887628" target="_blank" rel="noreferrer" className="block rounded-lg bg-primary p-3 text-center font-bold text-primary-foreground">💬 Still stuck? Chat on WhatsApp</a>
      </main>
    </div>
  );
}
