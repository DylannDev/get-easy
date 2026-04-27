"use client";

import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { PiMagnifyingGlass } from "react-icons/pi";
import { TABS, type TabKey } from "./types";

interface Props {
  tab: TabKey;
  setTab: (tab: TabKey) => void;
  search: string;
  setSearch: (v: string) => void;
  yearFilter: "all" | number;
  setYearFilter: (v: "all" | number) => void;
  availableYears: number[];
}

/** Header de la card "Documents" : ligne d'onglets (scroll horizontal sur
 *  mobile) + recherche texte + sélecteur d'année. */
export function DocumentsFilters({
  tab,
  setTab,
  search,
  setSearch,
  yearFilter,
  setYearFilter,
  availableYears,
}: Props) {
  return (
    <>
      <div className="border-b border-gray-200 flex gap-1 -mb-4 overflow-x-auto whitespace-nowrap [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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
      <div className="flex flex-col gap-2 pt-4 mt-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
        <div className="relative w-full sm:flex-1 sm:min-w-[240px]">
          <PiMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher (nom client, numéro, fichier…)"
            className="pl-9"
          />
        </div>
        <div className="w-full sm:w-auto">
          <NativeSelect
            value={yearFilter === "all" ? "all" : String(yearFilter)}
            onValueChange={(val) =>
              setYearFilter(val === "all" ? "all" : Number(val))
            }
            options={[
              { value: "all", label: "Toutes les années" },
              ...availableYears.map((y) => ({
                value: String(y),
                label: String(y),
              })),
            ]}
            className="sm:min-w-[180px]"
          />
        </div>
      </div>
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
      className={`shrink-0 px-4 py-2 text-sm font-medium cursor-pointer transition-colors -mb-px border-b-2 ${
        active
          ? "border-black text-foreground"
          : "border-transparent text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}
