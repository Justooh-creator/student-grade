import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { AuthPage } from "@/components/AuthPage";
import { useUser } from "@/lib/auth";
import { validateClassSearch } from "@/lib/classSearch";
import { accountHome } from "@/lib/accountAccess";

export const Route = createFileRoute("/")({
  validateSearch: validateClassSearch,
  head: () => ({ meta: [
    { title: "EduReport Ghana — School Management & GES SBA Report Cards" },
    { name: "description", content: "EduReport Ghana by JA EduTech Solutions (founded by Justice Atideku): offline-first school management, GES SBA assessments and A4 terminal report cards for KG 1 to Basic 9." },
    { property: "og:title", content: "EduReport Ghana by JA EduTech Solutions" },
    { property: "og:description", content: "Automated school report card generation, SBA scaling, and learner record management for Ghanaian educators. Developed by JA EduTech Solutions." },
    { property: "og:type", content: "website" },
    { property: "og:site_name", content: "JA EduTech Solutions" },
    { property: "og:url", content: "https://edureportghana.com" },
    { property: "og:image", content: "https://edureportghana.com/logo.png" },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: "EduReport Ghana - JA EduTech Solutions" },
    { name: "twitter:description", content: "Automated terminal reporting and SBA tools for Ghanaian basic schools by JA EduTech Solutions." },
    { name: "twitter:image", content: "https://edureportghana.com/logo.png" },
    { name: "author", content: "JA EduTech Solutions, Justice Atideku" },
  ], links: [{ rel: "canonical", href: "https://edureportghana.com/" }], scripts: [{ type: "application/ld+json", children: JSON.stringify({ "@context": "https://schema.org", "@graph": [
    { "@type": "Organization", "@id": "https://edureportghana.com/#organization", name: "JA EduTech Solutions", url: "https://edureportghana.com", logo: "https://edureportghana.com/logo.png", founder: { "@type": "Person", name: "Justice Atideku" }, sameAs: ["https://www.linkedin.com/company/ja-edutech-solutions"] },
    { "@type": "SoftwareApplication", name: "EduReport Ghana", url: "https://edureportghana.com/", applicationCategory: "EducationalApplication", operatingSystem: "Web, Android", description: "Automated school report card generation, SBA scaling, and learner record management for Ghanaian basic schools.", author: { "@id": "https://edureportghana.com/#organization" }, publisher: { "@id": "https://edureportghana.com/#organization" } },
  ] }) }] }),
  component: Welcome,
});

function Welcome() {
  const { user } = useUser();
  const search = Route.useSearch();
  const navigate = useNavigate();
  useEffect(() => { if (user) void navigate({ to: accountHome, search, replace: true }); }, [user, navigate, search]);
  if (user) return <div role="status" className="flex min-h-screen items-center justify-center bg-background text-primary">Opening School Details…</div>;
  return <AuthPage />;
}