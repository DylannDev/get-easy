"use client";

import { EditorContent } from "@tiptap/react";
import type { RichTextDocument } from "@/domain/agency";
import { useRichTextEditor } from "./rich-text/use-rich-text-editor";
import { EditorToolbar } from "./rich-text/editor-toolbar";

interface Props {
  value: RichTextDocument | null;
  onChange: (doc: RichTextDocument) => void;
  placeholder?: string;
}

/** Éditeur de texte riche basé sur TipTap. Le setup et la synchro sont
 *  dans `useRichTextEditor` ; la toolbar est un composant séparé. Le
 *  container est volontairement minimal — il ne fait qu'agencer les 2. */
export function RichTextEditor({ value, onChange, placeholder }: Props) {
  const editor = useRichTextEditor({ value, onChange, placeholder });

  if (!editor) return null;

  return (
    <div className="border border-gray-300 rounded-md overflow-hidden bg-white flex flex-col flex-1 min-h-0">
      <EditorToolbar editor={editor} />
      <div className="flex-1 min-h-0 overflow-y-auto">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
