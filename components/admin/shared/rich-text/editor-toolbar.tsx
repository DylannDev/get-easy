"use client";

import type { Editor } from "@tiptap/react";
import {
  PiArrowUUpLeft,
  PiArrowUUpRight,
  PiLink,
  PiListBullets,
  PiListNumbers,
  PiTextAlignCenter,
  PiTextAlignJustify,
  PiTextAlignLeft,
  PiTextAlignRight,
  PiTextB,
  PiTextItalic,
  PiTextUnderline,
} from "react-icons/pi";
import { ToolbarButton, ToolbarSeparator } from "./toolbar-button";

interface Props {
  editor: Editor;
}

/** Toolbar complète de l'éditeur : titres, format texte, listes, alignement,
 *  lien, undo/redo. Toutes les actions sont chaînées via `editor.chain()`. */
export function EditorToolbar({ editor }: Props) {
  // Compte les H1 existants — on doit forcer un seul H1 par document
  // (le bouton est désactivé si un H1 existe déjà ailleurs).
  let h1Count = 0;
  editor.state.doc.descendants((node) => {
    if (node.type.name === "heading" && node.attrs.level === 1) h1Count += 1;
  });
  const currentIsH1 = editor.isActive("heading", { level: 1 });
  const disableH1 = h1Count >= 1 && !currentIsH1;

  const handleLink = () => {
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("URL du lien (vide pour supprimer)", previousUrl);
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-gray-200 bg-gray-50 p-2 shrink-0">
      <ToolbarButton
        active={currentIsH1}
        disabled={disableH1}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        label="Titre de niveau 1 (h1)"
        wide
      >
        Titre
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive("heading", { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        label="Titre de niveau 2 (h2)"
        wide
      >
        Sous-titre
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive("heading", { level: 3 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        label="Titre de niveau 3 (h3)"
        wide
      >
        Rubrique
      </ToolbarButton>

      <ToolbarSeparator />

      <ToolbarButton
        active={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
        label="Gras"
      >
        <PiTextB className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        label="Italique"
      >
        <PiTextItalic className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive("underline")}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        label="Souligné"
      >
        <PiTextUnderline className="size-4" />
      </ToolbarButton>

      <ToolbarSeparator />

      <ToolbarButton
        active={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        label="Liste à puces"
      >
        <PiListBullets className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive("orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        label="Liste numérotée"
      >
        <PiListNumbers className="size-4" />
      </ToolbarButton>

      <ToolbarSeparator />

      <ToolbarButton
        active={editor.isActive({ textAlign: "left" })}
        onClick={() => editor.chain().focus().setTextAlign("left").run()}
        label="Aligner à gauche"
      >
        <PiTextAlignLeft className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive({ textAlign: "center" })}
        onClick={() => editor.chain().focus().setTextAlign("center").run()}
        label="Centrer"
      >
        <PiTextAlignCenter className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive({ textAlign: "right" })}
        onClick={() => editor.chain().focus().setTextAlign("right").run()}
        label="Aligner à droite"
      >
        <PiTextAlignRight className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive({ textAlign: "justify" })}
        onClick={() => editor.chain().focus().setTextAlign("justify").run()}
        label="Justifier"
      >
        <PiTextAlignJustify className="size-4" />
      </ToolbarButton>

      <ToolbarSeparator />

      <ToolbarButton
        active={editor.isActive("link")}
        onClick={handleLink}
        label="Lien"
      >
        <PiLink className="size-4" />
      </ToolbarButton>

      <div className="ml-auto flex items-center gap-1">
        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          label="Annuler"
        >
          <PiArrowUUpLeft className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          label="Rétablir"
        >
          <PiArrowUUpRight className="size-4" />
        </ToolbarButton>
      </div>
    </div>
  );
}
