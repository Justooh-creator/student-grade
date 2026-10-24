import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { AuthPage } from "@/components/AuthPage";
import { useUser } from "@/lib/auth";
import { validateClassSearch } from "@/lib/classSearch";

export const Route = createFileRoute("/")({
  validateSearch: validateClassSearch,
  head: () => ({ meta: [
    { title: "EduReport Ghana — School Management & GES SBA Report Cards" },
    { name: "description", content: "EduReport Ghana by JA EduTech Solutions (founded by Justice Atideku): offline-first school management, GES SBA assessments and A4 terminal report cards for KG 1 to Basic 9." },
    { property: "og:title", content: "EduReport Ghana — School Management & GES SBA Report Cards" },
    { property: "og:description", content: "Manage learners, SBA assessments and terminal report cards on your phone or laptop. Built in Ghana by JA EduTech Solutions." },
    { property: "og:type", content: "website" },
    { property: "og:url", content: "https://edureportghana.com/" },
    { name: "twitter:card", content: "summary" },
    { name: "author", content: "JA EduTech Solutions, Justice Atideku" },
  ], links: [{ rel: "canonical", href: "https://edureportghana.com/" }], scripts: [{ type: "application/ld+json", children: JSON.stringify({ "@context": "https://schema.org", "@type": "SoftwareApplication", name: "EduReport Ghana", url: "https://edureportghana.com/", applicationCategory: "EducationalApplication", operatingSystem: "Web, Android", publisher: { "@type": "Organization", name: "JA EduTech Solutions", founder: { "@type": "Person", name: "Justice Atideku" } }, author: { "@type": "Person", name: "Justice Atideku" } }) }] }),
  component: Welcome,
});

function Welcome() {
  const { user } = useUser();
  const search = Route.useSearch();
  const navigate = useNavigate();
  useEffect(() => { if (user) void navigate({ to: "/sba-details", search, replace: true }); }, [user, navigate, search]);
  if (user) return <div role="status" className="flex min-h-screen items-center justify-center bg-background text-primary">Opening SBA Details…</div>;
  return <AuthPage />;
}