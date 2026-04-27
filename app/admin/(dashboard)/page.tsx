import { redirect } from "next/navigation";

/**
 * Le tableau de bord a été supprimé : ses 3 compteurs (départs, retours,
 * locations en cours) ont été déplacés en haut de la page Planning. Toute
 * navigation vers `/admin` est redirigée vers le planning.
 */
export default function AdminIndexPage() {
  redirect("/admin/planning");
}
