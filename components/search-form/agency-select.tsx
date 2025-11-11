"use client";

import { MapPin } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Agency {
  id: string;
  name: string;
  city: string;
}

interface AgencySelectProps {
  agencies: Agency[];
  value: string;
  onValueChange: (value: string) => void;
}

export const AgencySelect = ({
  agencies,
  value,
  onValueChange,
}: AgencySelectProps) => {
  return (
    <div className="flex-1 min-w-[180px] w-1/3">
      <label className="block text-xs text-gray font-medium mb-1.5">
        Agence
      </label>
      <div className="relative">
        <MapPin className="absolute -left-0.5 top-1/2 -translate-y-1/2 size-4 text-black pointer-events-none z-10" />
        <Select value={value} onValueChange={onValueChange}>
          <SelectTrigger className="w-full cursor-pointer pl-5">
            <SelectValue placeholder="Choisir une agence" />
          </SelectTrigger>
          <SelectContent sideOffset={16}>
            {agencies.map((agency) => (
              <SelectItem key={agency.id} value={agency.id}>
                {agency.name} - {agency.city}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
