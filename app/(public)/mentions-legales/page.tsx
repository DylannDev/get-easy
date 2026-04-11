import { Metadata } from "next";
import { loadMarkdown } from "@/lib/markdown";
import { LegalLayout } from "@/components/legal/legal-layout";

export const metadata: Metadata = {
  title: "Mentions légales - Get Easy",
  description:
    "Mentions légales de Get Easy, service de location de voitures en Guyane",
};

export default async function MentionsLegalesPage() {
  const { html } = await loadMarkdown("/content/legal/mentions-legales.md");

  return (
    <LegalLayout>
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </LegalLayout>
  );
}
