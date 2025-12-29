import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { remark } from "remark";
import html from "remark-html";

export interface MarkdownContent {
  html: string;
  metadata: {
    title?: string;
    description?: string;
    [key: string]: unknown;
  };
}

/**
 * Charge et convertit un fichier Markdown en HTML
 *
 * @param filePath - Chemin relatif depuis la racine du projet (ex: "/content/legal/mentions-legales.md")
 * @returns { html, metadata } - Le HTML converti et les métadonnées du frontmatter
 */
export async function loadMarkdown(filePath: string): Promise<MarkdownContent> {
  // Construire le chemin absolu depuis la racine du projet
  const fullPath = path.join(process.cwd(), filePath);

  // Lire le fichier markdown
  const fileContents = fs.readFileSync(fullPath, "utf8");

  // Parser le frontmatter avec gray-matter
  const { data, content } = matter(fileContents);

  // Convertir le markdown en HTML avec remark
  const processedContent = await remark()
    .use(html, { sanitize: false }) // sanitize: false pour permettre le HTML dans le markdown
    .process(content);

  const htmlContent = processedContent.toString();

  return {
    html: htmlContent,
    metadata: data,
  };
}
