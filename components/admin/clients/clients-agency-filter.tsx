"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { PiCaretDown, PiCheck } from "react-icons/pi";

interface AgencyInfo {
  id: string;
  name: string;
  city: string;
}

interface Props {
  agencies: AgencyInfo[];
}

export function ClientsAgencyFilter({ agencies }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedIds =
    searchParams.get("agencies")?.split(",").filter(Boolean) ?? [];

  const toggle = (agencyId: string) => {
    const current = new Set(selectedIds);
    if (current.has(agencyId)) {
      current.delete(agencyId);
    } else {
      current.add(agencyId);
    }
    const params = new URLSearchParams(searchParams.toString());
    const value = Array.from(current).join(",");
    if (value) {
      params.set("agencies", value);
    } else {
      params.delete("agencies");
    }
    params.delete("page");
    router.push(`?${params.toString()}`);
  };

  const toggleAll = () => {
    const params = new URLSearchParams(searchParams.toString());
    if (selectedIds.length === agencies.length) {
      params.delete("agencies");
    } else {
      params.set("agencies", agencies.map((a) => a.id).join(","));
    }
    params.delete("page");
    router.push(`?${params.toString()}`);
  };

  const clear = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("agencies");
    params.delete("page");
    router.push(`?${params.toString()}`);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="h-10 rounded-md border border-gray-300 px-3 text-sm flex items-center gap-2 cursor-pointer hover:border-gray-400 transition-colors shrink-0">
          <span className="text-muted-foreground">
            {selectedIds.length > 0
              ? `${selectedIds.length} agence${selectedIds.length > 1 ? "s" : ""}`
              : "Toutes les agences"}
          </span>
          <PiCaretDown className="size-3.5 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-1" align="end">
        {/* Select all */}
        <div
          onClick={toggleAll}
          className="flex items-center gap-2 w-full px-2 py-1.5 text-sm rounded-md hover:bg-green/50 cursor-pointer"
        >
          <Checkbox
            checked={selectedIds.length === agencies.length}
            onCheckedChange={toggleAll}
          />
          <span className="font-medium">Toutes les agences</span>
        </div>

        <div className="my-1 border-t" />

        {/* Each agency */}
        {agencies.map((agency) => {
          const isSelected = selectedIds.includes(agency.id);
          return (
            <div
              key={agency.id}
              onClick={() => toggle(agency.id)}
              className="flex items-center gap-2 w-full px-2 py-1.5 text-sm rounded-md hover:bg-green/50 cursor-pointer"
            >
              <div className="size-4 flex items-center justify-center">
                {isSelected && <PiCheck className="size-4" />}
              </div>
              <span className="truncate">
                {agency.name} · {agency.city}
              </span>
            </div>
          );
        })}

        {selectedIds.length > 0 && (
          <>
            <div className="my-1 border-t" />
            <button
              onClick={clear}
              className="w-full px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground text-center cursor-pointer"
            >
              Effacer le filtre
            </button>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
