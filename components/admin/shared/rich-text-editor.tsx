"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import {
  PiTextB,
  PiTextItalic,
  PiTextUnderline,
  PiListBullets,
  PiListNumbers,
  PiLink,
  PiArrowUUpLeft,
  PiArrowUUpRight,
  PiTextAlignLeft,
  PiTextAlignCenter,
  PiTextAlignRight,
  PiTextAlignJustify,
} from "react-icons/pi";
import { useEffect } from "react";
import type { RichTextDocument } from "@/domain/agency";

interface Props {
  value: RichTextDocument | null;
  onChange: (doc: RichTextDocument) => void;
  placeholder?: string;
}

export function RichTextEditor({ value, onChange, placeholder }: Props) {
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
    content: value ?? { type: "doc", content: [] },
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none p-4 focus:outline-none",
        "data-placeholder": placeholder ?? "",
      },
    },
    onUpdate: ({ editor }) => {
      // Tiptap's `getJSON()` returns nodes whose `attrs` are objects with a
      // null prototype. That shape cannot cross the React Server Components
      // boundary (server actions serialise with classical object prototype
      // rules) and the attrs silently end up empty on the server — which made
      // every heading default to level 1 after saving. Round-trip through
      // JSON to normalise everything to plain objects.
      const plain = JSON.parse(
        JSON.stringify(editor.getJSON())
      ) as RichTextDocument;
      onChange(plain);
    },
  });

  // Sync when parent swaps the value (e.g. switching agencies)
  useEffect(() => {
    if (!editor) return;
    const current = editor.getJSON();
    if (
      JSON.stringify(current) !==
      JSON.stringify(value ?? { type: "doc", content: [] })
    ) {
      editor.commands.setContent(value ?? { type: "doc", content: [] });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  if (!editor) return null;

  // Count the number of existing H1 nodes so we can disable the H1 button
  // when one already exists — the document should have a single H1.
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
    <div className="border border-gray-300 rounded-md overflow-hidden bg-white flex flex-col flex-1 min-h-0">
      <div className="flex flex-wrap items-center gap-1 border-b border-gray-200 bg-gray-50 p-2 shrink-0">
        <ToolbarButton
          active={currentIsH1}
          disabled={disableH1}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 1 }).run()
          }
          label="Titre de niveau 1 (h1)"
          wide
        >
          Titre
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("heading", { level: 2 })}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          label="Titre de niveau 2 (h2)"
          wide
        >
          Sous-titre
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("heading", { level: 3 })}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
          label="Titre de niveau 3 (h3)"
          wide
        >
          Rubrique
        </ToolbarButton>

        <Separator />

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

        <Separator />

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

        <Separator />

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

        <Separator />

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

      <div className="flex-1 min-h-0 overflow-y-auto">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

function ToolbarButton({
  active,
  disabled,
  onClick,
  label,
  wide,
  children,
}: {
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  label: string;
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={`h-8 rounded flex items-center justify-center transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
        wide ? "px-2 text-xs font-medium" : "size-8"
      } ${active ? "bg-black text-green" : "hover:bg-gray-200 text-foreground"}`}
    >
      {children}
    </button>
  );
}

function Separator() {
  return <div className="w-px h-5 bg-gray-300 mx-1" />;
}
