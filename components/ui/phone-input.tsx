"use client";

import { forwardRef, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";
import {
  getCountries,
  getCountryCallingCode,
} from "react-phone-number-input/input";
import type { Country } from "react-phone-number-input";
import countryNames from "react-phone-number-input/locale/fr.json";
import { cn } from "@/lib/utils";

// Liste des pays les plus courants en premier
const PRIORITY_COUNTRIES: Country[] = ["GF", "MQ", "GP", "RE", "FR"];

// Fonction pour formater le numéro de téléphone (grouper par 2)
const formatPhoneNumber = (number: string): string => {
  const cleaned = number.replace(/\s/g, "");

  // Si le nombre de chiffres est pair, on groupe par 2
  if (cleaned.length % 2 === 0) {
    const groups = cleaned.match(/.{1,2}/g);
    return groups ? groups.join(" ") : cleaned;
  }

  // Si le nombre de chiffres est impair, le premier groupe est de 1 chiffre
  if (cleaned.length === 0) return "";
  const firstDigit = cleaned[0];
  const rest = cleaned.substring(1);
  const groups = rest.match(/.{1,2}/g);
  return groups ? `${firstDigit} ${groups.join(" ")}` : firstDigit;
};

interface PhoneInputProps {
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  id?: string;
}

export const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ value = "", onChange, disabled, placeholder, className, id }, ref) => {
    // Parse le numéro pour extraire le code pays et le numéro
    const parsePhoneNumber = (
      phoneValue: string
    ): { countryCode: Country; number: string } => {
      if (!phoneValue) return { countryCode: "FR" as Country, number: "" };

      // Si le numéro commence par +, extraire le code pays
      if (phoneValue.startsWith("+")) {
        // Essayer de trouver le code pays
        const allCountries = getCountries();
        for (const country of allCountries) {
          const callingCode = getCountryCallingCode(country);
          if (phoneValue.startsWith(`+${callingCode}`)) {
            return {
              countryCode: country,
              number: phoneValue.substring(`+${callingCode}`.length).trim(),
            };
          }
        }
      }

      return { countryCode: "FR" as Country, number: phoneValue };
    };

    const { countryCode: initialCountry, number: initialNumber } =
      parsePhoneNumber(value);
    const [selectedCountry, setSelectedCountry] =
      useState<Country>(initialCountry);
    const [phoneNumber, setPhoneNumber] = useState<string>(initialNumber);

    // Obtenir la liste des pays triés avec priorités
    const getSortedCountries = (): Country[] => {
      const allCountries = getCountries();
      const priority = allCountries.filter((c) =>
        PRIORITY_COUNTRIES.includes(c)
      );
      const others = allCountries
        .filter((c) => !PRIORITY_COUNTRIES.includes(c))
        .sort();

      return [...priority, ...others];
    };

    const countries = getSortedCountries();

    const handleCountryChange = (country: string) => {
      const countryCode = country as Country;
      setSelectedCountry(countryCode);
      const callingCode = getCountryCallingCode(countryCode);
      const newValue = `+${callingCode}${phoneNumber}`;
      onChange?.(newValue);
    };

    const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      // Retirer tout sauf les chiffres et espaces
      const newNumber = e.target.value.replace(/[^\d\s]/g, "");
      // Retirer les espaces pour le stockage
      const cleanedNumber = newNumber.replace(/\s/g, "");
      setPhoneNumber(cleanedNumber);
      const callingCode = getCountryCallingCode(selectedCountry);
      const newValue = `+${callingCode}${cleanedNumber}`;
      onChange?.(newValue);
    };

    const callingCode = getCountryCallingCode(selectedCountry);

    // Fonction pour obtenir l'emoji du drapeau
    const getCountryFlag = (countryCode: string) => {
      const codePoints = countryCode
        .toUpperCase()
        .split("")
        .map((char) => 127397 + char.charCodeAt(0));
      return String.fromCodePoint(...codePoints);
    };

    // Obtenir le nom du pays
    const getCountryName = (country: Country): string => {
      return countryNames[country] || country;
    };

    // Formater le numéro pour l'affichage
    const displayPhoneNumber = formatPhoneNumber(phoneNumber);

    return (
      <div
        className={cn(
          "flex h-10 w-full rounded-md border border-gray-300 bg-white overflow-visible relative",
          className
        )}
      >
        {/* Sélecteur de pays avec Radix UI */}
        <div className="flex items-center shrink-0">
          <Select
            value={selectedCountry}
            onValueChange={handleCountryChange}
            disabled={disabled}
          >
            <SelectTrigger
              className="h-full border-0 bg-transparent pl-3 pr-2 focus:ring-0 focus:ring-offset-0 w-auto"
              id={`${id}-country`}
            >
              <SelectValue>
                <span className="flex items-center gap-1">
                  <span>{getCountryFlag(selectedCountry)}</span>
                </span>
              </SelectValue>
            </SelectTrigger>
            <SelectContent
              position="popper"
              align="start"
              className="max-h-[200px] overflow-y-auto min-w-[300px]"
              style={{ width: "var(--radix-select-trigger-width)" }}
            >
              {countries.map((country) => {
                const code = getCountryCallingCode(country);
                const name = getCountryName(country);
                return (
                  <SelectItem key={country} value={country} className="">
                    <span className="flex items-center gap-2">
                      <span className="text-gray-500 min-w-10">+{code}</span>
                      <span>{getCountryFlag(country)}</span>
                      <span>{name}</span>
                    </span>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        {/* Input du numéro */}
        <div className="flex flex-1 items-center pr-3">
          <span className="text-sm text-gray-500 mr-2">+{callingCode}</span>
          <input
            ref={ref}
            id={id}
            type="tel"
            value={displayPhoneNumber}
            onChange={handleNumberChange}
            disabled={disabled}
            placeholder={placeholder || "6 94 38 55 55"}
            className="flex-1 bg-transparent text-sm outline-none disabled:cursor-not-allowed disabled:opacity-50 placeholder:text-sm"
          />
        </div>
      </div>
    );
  }
);

PhoneInput.displayName = "PhoneInput";
