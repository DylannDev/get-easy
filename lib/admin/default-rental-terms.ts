import "server-only";
import { generateJSON } from "@tiptap/html";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import { loadMarkdown } from "@/lib/markdown";
import type { RichTextDocument } from "@/domain/agency";

const EXTENSIONS = [
  StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
  Link.configure({ openOnClick: false, autolink: true }),
];

let cached: RichTextDocument | null = null;

/**
 * Returns the legacy markdown terms converted to a Tiptap JSON document,
 * used to seed the editor when an agency has not customised its terms yet.
 * Result is cached for the process lifetime.
 */
export async function getDefaultRentalTerms(): Promise<RichTextDocument> {
  if (cached) return cached;
  const { html } = await loadMarkdown(
    "/content/legal/conditions-generales-de-location.md"
  );
  // `generateJSON` produces objects with null-prototype children (for `attrs`)
  // which cannot be serialised over the RSC boundary. Round-trip through JSON
  // to normalise everything to plain objects.
  const raw = generateJSON(html, EXTENSIONS);
  cached = JSON.parse(JSON.stringify(raw)) as RichTextDocument;
  return cached;
}
