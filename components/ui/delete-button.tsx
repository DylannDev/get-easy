import { type ComponentProps } from "react";
import { Button } from "./button";
import { PiTrash } from "react-icons/pi";

type Props = Omit<
  ComponentProps<typeof Button>,
  "variant" | "size" | "children"
> & {
  /** Texte à droite de l'icône. Par défaut "Supprimer". */
  label?: string;
};

/**
 * Bouton "Supprimer" standardisé : variant red + icône corbeille + label.
 * À utiliser pour toutes les actions de suppression de l'app afin de
 * garantir la cohérence visuelle. Ne gère PAS la confirmation — l'appelant
 * doit câbler son propre AlertDialog ou dialog custom si besoin.
 */
export function DeleteButton({ label = "Supprimer", ...rest }: Props) {
  return (
    <Button type="button" variant="red" size="sm" {...rest}>
      <PiTrash className="size-4" />
      {label}
    </Button>
  );
}
