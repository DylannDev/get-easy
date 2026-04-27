"use client";

interface Props {
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  label: string;
  /** Bouton "large" pour les actions textuelles (Titre, Sous-titre, Rubrique).
   *  Par défaut le bouton est carré 32×32. */
  wide?: boolean;
  children: React.ReactNode;
}

/** Bouton standard de la toolbar TipTap : square 32×32 (icône) ou large
 *  (texte). Style "actif" = fond noir + texte vert. */
export function ToolbarButton({
  active,
  disabled,
  onClick,
  label,
  wide,
  children,
}: Props) {
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

/** Séparateur vertical entre groupes de boutons. */
export function ToolbarSeparator() {
  return <div className="w-px h-5 bg-gray-300 mx-1" />;
}
