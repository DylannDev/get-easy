"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useRef, useCallback } from "react";
import { PiMagnifyingGlass, PiX, PiCheck, PiCaretDown } from "react-icons/pi";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const STATUS_OPTIONS = [
  { value: "paid", label: "Confirmée" },
  { value: "pending_payment", label: "En attente" },
  { value: "payment_failed", label: "Échec paiement" },
  { value: "refunded", label: "Remboursée" },
  { value: "cancelled", label: "Annulée" },
  { value: "expired", label: "Expirée" },
];

export function ReservationsFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const selectedStatuses = searchParams.get("status")?.split(",").filter(Boolean) ?? [];
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, val] of Object.entries(updates)) {
        if (val) {
          params.set(key, val);
        } else {
          params.delete(key);
        }
      }
      params.delete("page");
      router.push(`?${params.toString()}`);
    },
    [router, searchParams]
  );

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      updateParams({ search: search || null });
    }, 400);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [search]);

  const toggleStatus = (status: string) => {
    const current = new Set(selectedStatuses);
    if (current.has(status)) {
      current.delete(status);
    } else {
      current.add(status);
    }
    const value = Array.from(current).join(",");
    updateParams({ status: value || null });
  };

  const clearFilters = () => {
    setSearch("");
    router.push("?");
  };

  const hasFilters = search || selectedStatuses.length > 0;

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
      <div className="relative w-full sm:max-w-sm sm:flex-1">
        <PiMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un client, un email..."
          className="pl-9 pr-8 text-sm"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <PiX className="size-3.5" />
          </button>
        )}
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <Popover>
          <PopoverTrigger asChild>
            <button className="h-10 rounded-md border border-gray-300 px-3 text-sm flex items-center gap-2 cursor-pointer hover:border-gray-400 transition-colors">
              <span className="text-muted-foreground">
                {selectedStatuses.length > 0
                  ? `${selectedStatuses.length} statut${selectedStatuses.length > 1 ? "s" : ""}`
                  : "Tous les statuts"}
              </span>
              <PiCaretDown className="size-3.5 text-muted-foreground" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-52 p-1" align="end">
            {STATUS_OPTIONS.map((opt) => {
              const isSelected = selectedStatuses.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  onClick={() => toggleStatus(opt.value)}
                  className="flex items-center gap-2 w-full px-2 py-1.5 text-sm rounded-md hover:bg-green/50 cursor-pointer"
                >
                  <div className="size-4 flex items-center justify-center">
                    {isSelected && <PiCheck className="size-4" />}
                  </div>
                  {opt.label}
                </button>
              );
            })}
          </PopoverContent>
        </Popover>

        {hasFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <PiX className="size-3" />
            Effacer
          </button>
        )}
      </div>
    </div>
  );
}
