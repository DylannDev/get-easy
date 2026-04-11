import { Metadata } from "next";
import { loadMarkdown } from "@/lib/markdown";
import { LegalLayout } from "@/components/legal/legal-layout";

export const metadata: Metadata = {
  title: "Conditions générales de location - Get Easy",
  description:
    "Conditions générales de location de Get Easy, service de location de voitures en Guyane",
};

export default async function ConditionsGeneralesPage() {
  const { html } = await loadMarkdown(
    "/content/legal/conditions-generales-de-location.md"
  );

  return (
    <LegalLayout>
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </LegalLayout>
  );
}
