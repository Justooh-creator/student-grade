import { createFileRoute } from "@tanstack/react-router";
import { AuthPage } from "@/components/AuthPage";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign up or sign in — EduReport Ghana" },
      { name: "description", content: "Create your EduReport teacher account or sign in to manage school details, learners and GES assessments." },
      { property: "og:title", content: "Sign up or sign in — EduReport Ghana" },
      { property: "og:description", content: "Your EduReport account for Ghanaian basic-school assessments and report cards." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "author", content: "JA EduTech Solutions, Justice Atideku" },
      { property: "og:url", content: "https://edureportghana.com/auth" },
    ],
    links: [{ rel: "canonical", href: "https://edureportghana.com/auth" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: "EduReport Ghana",
          url: "https://edureportghana.com",
          applicationCategory: "EducationalApplication",
          operatingSystem: "Web, Android",
          description:
            "School management and SBA report-card app for Ghanaian basic schools (KG 1 – Basic 9).",
          offers: { "@type": "Offer", price: "0", priceCurrency: "GHS" },
          author: {
            "@type": "Person",
            name: "Justice Atideku",
            jobTitle: "A Teacher & Software Developer",
            email: "mailto:jatideku@gmail.com",
            address: { "@type": "PostalAddress", addressLocality: "South Tongu", addressCountry: "GH" },
          },
        }),
      },
    ],
  }),
  component: AuthPage,
});

