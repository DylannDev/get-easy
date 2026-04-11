"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PiCheck } from "react-icons/pi";
import type { Vehicle } from "@/domain/vehicle";

interface VehicleGridProps {
  vehicles: Vehicle[];
  onNavigate?: () => void;
  selectMode?: boolean;
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
}

export function VehicleGrid({
  vehicles,
  onNavigate,
  selectMode = false,
  selectedIds = new Set(),
  onToggleSelect,
}: VehicleGridProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");

  const filtered = search
    ? vehicles.filter((v) => {
        const s = search.toLowerCase();
        return (
          v.brand.toLowerCase().includes(s) ||
          v.model.toLowerCase().includes(s) ||
          v.registrationPlate.toLowerCase().includes(s) ||
          String(v.year).includes(s)
        );
      })
    : vehicles;

  const handleClick = (vehicle: Vehicle) => {
    if (selectMode) {
      onToggleSelect?.(vehicle.id);
    } else {
      onNavigate?.();
      router.push(`/admin/vehicules/${vehicle.id}`);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative max-w-sm">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 256 256"
          fill="currentColor"
        >
          <path d="M229.66,218.34l-50.07-50.06a88.11,88.11,0,1,0-11.31,11.31l50.06,50.07a8,8,0,0,0,11.32-11.32ZM40,112a72,72,0,1,1,72,72A72.08,72.08,0,0,1,40,112Z" />
        </svg>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher par marque, modèle, plaque..."
          className="h-10 w-full rounded-md border border-gray-300 pl-9 pr-3 text-sm outline-none"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <svg
              className="size-3.5"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 256 256"
              fill="currentColor"
            >
              <path d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z" />
            </svg>
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground py-10 text-center">
          {search ? "Aucun véhicule trouvé." : "Aucun véhicule enregistré."}
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((vehicle) => {
            const isSelected = selectedIds.has(vehicle.id);
            return (
              <div
                key={vehicle.id}
                onClick={() => handleClick(vehicle)}
                className="cursor-pointer"
              >
                <Card
                  className={`transition-all h-full ${
                    selectMode && isSelected
                      ? "border-2 border-green ring-2 ring-green/20"
                      : selectMode
                        ? "border-2 border-transparent hover:border-gray-300"
                        : "hover:border-gray-300"
                  }`}
                >
                  <CardContent className="p-0 relative">
                    {/* Selection indicator */}
                    {selectMode && (
                      <div
                        className={`absolute top-3 right-3 z-10 size-6 rounded-full flex items-center justify-center ${
                          isSelected
                            ? "bg-green text-black"
                            : "bg-white border-2 border-gray-300"
                        }`}
                      >
                        {isSelected && <PiCheck className="size-4" />}
                      </div>
                    )}
                    <div className="relative h-40 bg-gray-50 rounded-xl m-3 overflow-hidden">
                      <Image
                        src={vehicle.img}
                        alt={`${vehicle.brand} ${vehicle.model}`}
                        fill
                        className="object-cover rounded-md"
                      />
                    </div>
                    <div className="p-4 space-y-2">
                      <div>
                        <h3 className="font-semibold text-sm">
                          {vehicle.brand} {vehicle.model}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {vehicle.color} · {vehicle.registrationPlate}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="black" className="text-xs">
                          {vehicle.transmission}
                        </Badge>
                        <Badge variant="black" className="text-xs">
                          {vehicle.fuelType}
                        </Badge>
                        <Badge variant="black" className="text-xs">
                          {vehicle.numberOfSeats} places
                        </Badge>
                        <Badge variant="black" className="text-xs">
                          {vehicle.year}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-xs text-muted-foreground">
                          {vehicle.registrationPlate}
                        </span>
                        <span className="text-sm font-semibold">
                          {vehicle.pricePerDay} €/jour
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
