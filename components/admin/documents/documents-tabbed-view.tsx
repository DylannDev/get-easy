"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { buttonVariants } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ContentOverlay } from "@/components/admin/shared/content-overlay";
import {
  deleteDocument,
  getDocumentDownloadUrl,
  getDocumentInlineUrl,
} from "@/actions/admin/documents";
import {
  PiDownload,
  PiEye,
  PiTrash,
  PiFilePdf,
  PiImage,
  PiMagnifyingGlass,
} from "react-icons/pi";
import { formatDateCayenne } from "@/lib/format-date";
import { isQuoteExpired } from "@/domain/quote";
import type { EnrichedDocument } from "./documents-content";

interface Props {
  documents: EnrichedDocument[];
}

/** Type d'onglet — les "autres" documents sont volontairement fusionnés
 *  avec les contrats (rares) via un filtrage souple ; on peut les isoler
 *  plus tard si besoin. */
type TabKey = "invoice" | "quote" | "contract";

const TABS: { key: TabKey; label: string }[] = [
  { key: "invoice", label: "Factures" },
  { key: "quote", label: "Devis" },
  { key: "contract", label: "Contrats" },
];

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / 1024 / 1024).toFixed(2)} Mo`;
}

/** Retourne l'ensemble des années distinctes apparaissant dans les docs. */
function extractYears(docs: EnrichedDocument[]): number[] {
  const years = new Set<number>();
  for (const d of docs) years.add(new Date(d.createdAt).getFullYear());
  return Array.from(years).sort((a, b) => b - a);
}

export function DocumentsTabbedView({ documents }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<TabKey>("invoice");
  const [search, setSearch] = useState("");
  const [yearFilter, setYearFilter] = useState<"all" | number>("all");
  const [loading, setLoading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const docsByTab = useMemo(() => {
    const groups: Record<TabKey, EnrichedDocument[]> = {
      invoice: [],
      quote: [],
      contract: [],
    };
    for (const d of documents) {
      if (d.type === "invoice") groups.invoice.push(d);
      else if (d.type === "quote") groups.quote.push(d);
      else if (d.type === "contract") groups.contract.push(d);
      // "other" ignoré par défaut — s'ajoutera si besoin plus tard.
    }
    return groups;
  }, [documents]);

  // Années disponibles dans l'onglet courant (sinon le select montre des
  // années vides, déroutant).
  const availableYears = useMemo(
    () => extractYears(docsByTab[tab]),
    [docsByTab, tab],
  );

  // Applique recherche + année sur l'onglet courant.
  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return docsByTab[tab].filter((d) => {
      if (
        yearFilter !== "all" &&
        new Date(d.createdAt).getFullYear() !== yearFilter
      ) {
        return false;
      }
      if (!q) return true;
      const haystacks = [
        d.fileName,
        d.invoiceNumber ?? "",
        d.quoteNumber ?? "",
        d.customer ? `${d.customer.firstName} ${d.customer.lastName}` : "",
      ].map((s) => s.toLowerCase());
      return haystacks.some((s) => s.includes(q));
    });
  }, [docsByTab, tab, search, yearFilter]);

  const handleView = async (id: string) => {
    setLoading(true);
    const url = await getDocumentInlineUrl(id);
    setLoading(false);
    if (url) window.open(url, "_blank");
  };

  const handleDownload = async (id: string) => {
    setLoading(true);
    const url = await getDocumentDownloadUrl(id);
    setLoading(false);
    if (url) {
      const a = document.createElement("a");
      a.href = url;
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      a.remove();
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setLoading(true);
    const doc = documents.find((d) => d.id === deleteId);
    await deleteDocument(deleteId, doc?.bookingId ?? null);
    setDeleteId(null);
    setLoading(false);
    router.refresh();
  };

  return (
    <>
      {loading && <ContentOverlay />}

      <Card>
        <CardHeader className="space-y-4 pb-4">
          {/* Onglets */}
          <div className="border-b border-gray-200 flex gap-1 -mb-4">
            {TABS.map((t) => (
              <TabButton
                key={t.key}
                active={tab === t.key}
                onClick={() => setTab(t.key)}
              >
                {t.label}
              </TabButton>
            ))}
          </div>
          {/* Filtres */}
          <div className="flex flex-wrap items-center gap-3 pt-4 mt-3">
            <div className="relative flex-1 min-w-[240px]">
              <PiMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher (nom client, numéro, fichier…)"
                className="pl-9"
              />
            </div>
            <select
              value={yearFilter === "all" ? "all" : String(yearFilter)}
              onChange={(e) =>
                setYearFilter(
                  e.target.value === "all" ? "all" : Number(e.target.value),
                )
              }
              className="h-10 rounded-md border border-gray-300 px-3 text-sm cursor-pointer"
            >
              <option value="all">Toutes les années</option>
              {availableYears.map((y) => (
                <option key={y} value={String(y)}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {rows.length === 0 ? (
            <p className="text-sm text-muted-foreground p-6">
              Aucun document ne correspond aux filtres.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fichier</TableHead>
                  <TableHead>Client</TableHead>
                  {tab === "quote" && <TableHead>Validité</TableHead>}
                  {tab === "contract" && <TableHead>Période</TableHead>}
                  <TableHead>Taille</TableHead>
                  <TableHead>Émis le</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((doc) => {
                  const isPdf = doc.mimeType === "application/pdf";
                  const expired =
                    tab === "quote" && doc.quoteValidUntil
                      ? isQuoteExpired({
                          validUntil: doc.quoteValidUntil,
                        })
                      : false;
                  return (
                    <TableRow key={doc.id}>
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          {isPdf ? (
                            <PiFilePdf className="size-5 text-red-500 shrink-0" />
                          ) : (
                            <PiImage className="size-5 text-blue-500 shrink-0" />
                          )}
                          <span className="text-sm font-medium truncate max-w-[260px]">
                            {doc.fileName}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {doc.customer ? (
                          <Link
                            href={`/admin/clients/${doc.customer.id}`}
                            className="text-black underline hover:no-underline"
                          >
                            {doc.customer.firstName} {doc.customer.lastName}
                          </Link>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      {tab === "quote" && (
                        <TableCell className="text-sm">
                          {doc.quoteValidUntil ? (
                            <div className="flex items-center gap-2">
                              <span
                                className={
                                  expired ? "text-muted-foreground" : ""
                                }
                              >
                                {formatDateCayenne(
                                  doc.quoteValidUntil,
                                  "dd MMM yyyy",
                                )}
                              </span>
                              {expired && (
                                <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide bg-red-50 text-red-600 border border-red-100">
                                  Expiré
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      )}
                      {tab === "contract" && (
                        <TableCell className="text-sm">
                          {doc.booking ? (
                            <span>
                              {formatDateCayenne(
                                doc.booking.startDate,
                                "dd MMM",
                              )}
                              {" → "}
                              {formatDateCayenne(
                                doc.booking.endDate,
                                "dd MMM yyyy",
                              )}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      )}
                      <TableCell className="text-sm">
                        {formatSize(doc.size)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDateCayenne(doc.createdAt, "dd MMM yyyy")}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleView(doc.id)}
                            className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer transition-colors"
                            title="Visualiser"
                          >
                            <PiEye className="size-4" />
                          </button>
                          <button
                            onClick={() => handleDownload(doc.id)}
                            className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer transition-colors"
                            title="Télécharger"
                          >
                            <PiDownload className="size-4" />
                          </button>
                          <button
                            onClick={() => setDeleteId(doc.id)}
                            className="p-2 rounded-md text-muted-foreground hover:text-red-500 hover:bg-red-50 cursor-pointer transition-colors"
                            title="Supprimer"
                          >
                            <PiTrash className="size-4" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce document ?</AlertDialogTitle>
            <AlertDialogDescription>
              Le fichier sera définitivement supprimé du stockage. Cette action
              est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-2 border-black text-black hover:text-green bg-transparent shadow-none">
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className={buttonVariants({ variant: "red" })}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium cursor-pointer transition-colors -mb-px border-b-2 ${
        active
          ? "border-black text-foreground"
          : "border-transparent text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}
