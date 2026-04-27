"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import { PiDownload } from "react-icons/pi";
import { useCsvExport } from "./use-csv-export";

interface Props {
  year: number;
  availableYears: number[];
}

/** Header de la page Statistiques : sélecteur d'année (synchronisé avec
 *  `?year=` dans l'URL) + bouton d'export CSV. */
export function StatsHeader({ year, availableYears }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { exporting, exportCsv } = useCsvExport(year);

  const handleYearChange = (newYear: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("year", newYear);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">Année</span>
        <div className="min-w-[120px]">
          <NativeSelect
            value={String(year)}
            onValueChange={handleYearChange}
            options={availableYears.map((y) => ({
              value: String(y),
              label: String(y),
            }))}
          />
        </div>
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-full sm:w-auto"
        onClick={exportCsv}
        disabled={exporting}
      >
        <PiDownload className="size-4" />
        {exporting ? "Export…" : "Exporter CSV"}
      </Button>
    </div>
  );
}
