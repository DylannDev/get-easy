import { Metadata } from "next";
import { generateHTML } from "@tiptap/html";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import DOMPurify from "isomorphic-dompurify";
import { loadMarkdown } from "@/lib/markdown";
import { LegalLayout } from "@/components/legal/legal-layout";
import { getContainer } from "@/composition-root/container";
import type { JSONContent } from "@tiptap/react";

export const metadata: Metadata = {
  title: "Conditions générales de location - Get Easy",
  description:
    "Conditions générales de location de Get Easy, service de location de voitures en Guyane",
};

interface PageProps {
  searchParams: Promise<{ agency?: string }>;
}

/**
 * Returns true if the Tiptap JSON doc has any user-written content.
 * A freshly-initialised editor serialises to `{ type: "doc", content: [] }`
 * or `{ type: "doc", content: [{ type: "paragraph" }] }` — both should be
 * treated as "empty" so we fall back to the static markdown.
 */
function hasContent(doc: unknown): boolean {
  if (!doc || typeof doc !== "object") return false;
  const content = (doc as { content?: unknown[] }).content;
  if (!Array.isArray(content) || content.length === 0) return false;
  // Tiptap always inserts at least one paragraph — check it has children
  return content.some((node) => {
    if (!node || typeof node !== "object") return false;
    const c = (node as { content?: unknown[] }).content;
    return Array.isArray(c) && c.length > 0;
  });
}

export default async function ConditionsGeneralesPage({
  searchParams,
}: PageProps) {
  const { agency: agencyIdParam } = await searchParams;
  const { agencyRepository } = getContainer();

  // Pick the requested agency, or fall back to the first one.
  let agency = null;
  if (agencyIdParam) {
    agency = await agencyRepository.findById(agencyIdParam);
  }
  if (!agency) {
    const all = await agencyRepository.findAll();
    agency = all[0] ?? null;
  }

  let html: string;
  if (agency && hasContent(agency.rentalTerms)) {
    const rawHtml = generateHTML(agency.rentalTerms as JSONContent, [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Underline,
      TextAlign.configure({
        types: ["heading", "paragraph"],
        alignments: ["left", "center", "right", "justify"],
      }),
      Link.configure({ openOnClick: false, autolink: true }),
    ]);
    html = DOMPurify.sanitize(rawHtml);
  } else {
    // Fallback to the legacy markdown for agencies that haven't customised
    // their terms yet.
    const md = await loadMarkdown(
      "/content/legal/conditions-generales-de-location.md"
    );
    html = md.html;
  }

  return (
    <LegalLayout>
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </LegalLayout>
  );
}
