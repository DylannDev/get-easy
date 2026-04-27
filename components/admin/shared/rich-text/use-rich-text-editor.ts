"use client";

import { useEffect } from "react";
import { useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import type { RichTextDocument } from "@/domain/agency";

interface Args {
  value: RichTextDocument | null;
  onChange: (doc: RichTextDocument) => void;
  placeholder?: string;
}

const EMPTY_DOC: RichTextDocument = { type: "doc", content: [] };

/**
 * Encapsule le setup de l'éditeur TipTap (extensions, content, onUpdate)
 * + la synchro avec une `value` externe (ex : changement d'agence courante).
 *
 * Note importante : `editor.getJSON()` retourne des `attrs` avec un proto
 * `null` qui ne traverse pas la frontière React Server Components — les
 * attrs (notamment `level` des headings) finissaient vidés côté serveur.
 * Le round-trip JSON.parse(JSON.stringify(...)) normalise vers des objets
 * classiques avant de remonter au caller.
 */
export function useRichTextEditor({ value, onChange, placeholder }: Args) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      TextAlign.configure({
        types: ["heading", "paragraph"],
        alignments: ["left", "center", "right", "justify"],
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: {
          class: "text-black underline hover:no-underline",
          rel: "noopener noreferrer",
          target: "_blank",
        },
      }),
    ],
    content: value ?? EMPTY_DOC,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none p-4 focus:outline-none",
        "data-placeholder": placeholder ?? "",
      },
    },
    onUpdate: ({ editor }) => {
      const plain = JSON.parse(
        JSON.stringify(editor.getJSON()),
      ) as RichTextDocument;
      onChange(plain);
    },
  });

  // Sync externe (parent qui change la valeur — ex : switch d'agence).
  useEffect(() => {
    if (!editor) return;
    const current = editor.getJSON();
    if (JSON.stringify(current) !== JSON.stringify(value ?? EMPTY_DOC)) {
      editor.commands.setContent(value ?? EMPTY_DOC);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return editor;
}
