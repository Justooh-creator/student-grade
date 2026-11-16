import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export const LANDING_FAQ: { q: string; a: string }[] = [
  { q: "What is EduReport Ghana?", a: "EduReport Ghana is a school app by JA EduTech Solutions for KG 1 to Basic 9. It handles SBA scores, GES terminal report cards, daily attendance, fees, certificates and practice questions — on a phone or laptop." },
  { q: "Do teachers need to retype scores?", a: "No. Teachers enter class scores and exam marks once in the SBA grid and EduReport works out the 50/50 totals, grades, positions and remarks. Learner names can be typed, uploaded from Excel, or read from a photo of the class register." },
  { q: "Do we have to retype learner names when a new school year begins?", a: "No. EduReport includes end-of-year promotion. With one tap, Basic 1 learners move up to Basic 2, Basic 2 to Basic 3, and so on. Their details, parent phone numbers and streams carry forward, so you only register new learners." },
  { q: "Does it work without internet?", a: "Yes. Teachers can keep entering scores and marking attendance offline. Everything saves to the school cloud once the phone is back online." },
  { q: "Does it follow GES grading?", a: "Yes. SBA 50% + Exam 50%, grades 1 to 9, class positions and remarks. Basic 7 to 9 show the Best Six aggregate: English, Mathematics, Integrated Science, Social Studies plus the two best electives. KG uses descriptive levels with no numerical grade." },
  { q: "Will the report card look like ours?", a: "Yes. Each A4 report card carries your school name, logo, motto, address, contact number, class teacher and headteacher signatures, school stamp and learner photos." },
  { q: "How do I register and set up our school cloud?", a: "1. Sign up with your email and password. 2. Open the menu and tap School Cloud. 3. As headteacher or lead teacher, choose Register a new school and enter your school name, region and district. 4. EduReport gives you a 6-character School Code. 5. Share the code with your teachers on WhatsApp — they sign up, tap Join your school and type the code, and the whole staff is connected." },
  { q: "Can schools with more than one stream (e.g. Basic 7A and 7B) use it?", a: "Yes. Each class can have its own streams. Every stream keeps its own register and stream-level positions, and headteachers can still see the whole class together on the broadsheet." },
  { q: "I'm a subject teacher, not a whole school. Can I still use it?", a: "Yes. You can use EduReport on your own as an independent teacher, or join your school with its School Code so the headteacher can assign you your classes and subjects." },
  { q: "How do parents get reports?", a: "Print the A4 report cards, save the whole class as PDF, or send each learner's results straight to the parent's WhatsApp. If the parent's number is not on WhatsApp, send the same results by SMS." },
  { q: "Is our school's data safe?", a: "Your records are stored in your school's own cloud space and only teachers who have joined your school can see them. You can also download a backup copy of your records at any time." },
  { q: "How much does it cost?", a: "Creating an account is free. An independent teacher pays GH₵30 for one term or GH₵75 for three terms. A whole school pays GH₵150 for one term or GH₵350 for three terms, covering all its teachers. A license is needed to print or save report PDFs." },
  { q: "Does it work for SHS, or only basic schools?", a: "EduReport is built for basic schools, from KG 1 to Basic 9. Chat with us on WhatsApp if you would like to hear when SHS support is ready." },
];

export function LandingFaq() {
  return (
    <section aria-labelledby="landing-faq" className="mx-auto w-full max-w-3xl px-5">
      <h2 id="landing-faq" className="text-center font-display text-2xl font-bold text-foreground">What Headteachers &amp; Teachers Ask Us</h2>
      <p className="mt-2 text-center text-sm text-muted-foreground">
        Got another question? Chat with <strong className="text-foreground">JA EduTech Solutions</strong> on WhatsApp at{" "}
        <a href="https://wa.me/233530887628" target="_blank" rel="noreferrer" className="font-bold text-primary underline">0530887628</a> or email{" "}
        <a href="mailto:support@edureportghana.com" className="break-words font-bold text-primary underline">support@edureportghana.com</a>.
      </p>
      <Accordion type="single" collapsible className="mt-5 rounded-xl border border-border bg-card px-4">
        {LANDING_FAQ.map((item, i) => (
          <AccordionItem key={item.q} value={`faq-${i}`} className={i === LANDING_FAQ.length - 1 ? "border-b-0" : undefined}>
            <AccordionTrigger className="text-base font-semibold">{item.q}</AccordionTrigger>
            <AccordionContent className="text-sm leading-relaxed text-muted-foreground">{item.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
