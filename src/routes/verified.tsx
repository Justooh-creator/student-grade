import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/verified")({
  head: () => ({ meta: [
    { title: "Email Verified — EduReport Ghana" },
    { name: "description", content: "Your EduReport Ghana account email has been verified. Return to EduReport to sign in." },
    { property: "og:title", content: "Email Verified — EduReport Ghana" },
    { property: "og:description", content: "Your EduReport account is now active." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex" },
  ] }),
  component: VerifiedPage,
});

function VerifiedPage() {
  return <div className="min-h-screen bg-background">
    <header className="border-b border-border bg-primary px-6 py-5 text-primary-foreground">
      <div className="mx-auto max-w-md"><p className="font-display text-xl font-black">🇬🇭 EduReport Ghana</p><p className="text-sm text-primary-foreground/90">A Product of JA EduTech Solutions</p></div>
    </header>
    <main className="mx-auto max-w-md px-5 py-12 text-center">
      <p className="text-6xl" aria-hidden>✅</p>
      <h1 className="mt-4 font-display text-2xl font-bold">Email Verified Successfully!</h1>
      <p className="mt-3 text-muted-foreground">Your EduReport account is now active. You can close this window and open the EduReport app to sign in.</p>
      <Button asChild className="mt-8 h-12 w-full"><Link to="/auth">Go to Sign In</Link></Button>
    </main>
  </div>;
}
