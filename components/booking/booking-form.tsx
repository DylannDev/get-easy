"use client";

import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft } from "lucide-react";
import {
  bookingFormSchema,
  type BookingFormData,
} from "@/lib/validations/booking";
import { Button } from "@/components/ui/button";
import { getCountriesListWithPriority } from "@/lib/countries";
import { CustomerDocumentsUpload } from "./customer-documents-upload";
import type { Vehicle } from "@/types";
import type { Agency } from "@/domain/agency";
import { useBookingSubmit } from "./form/use-booking-submit";
import { BusinessSection } from "./form/business-section";
import { PersonalInfoSection } from "./form/personal-info-section";
import { AddressSection } from "./form/address-section";
import { DriverLicenseSection } from "./form/driver-license-section";
import { TermsCheckbox } from "./form/terms-checkbox";

interface BookingFormProps {
  onBack: () => void;
  vehicle: Vehicle;
  agency: Agency;
  startDate: Date;
  endDate: Date;
  numberOfDays: number;
  totalPrice: number;
  selectedOptions?: { optionId: string; quantity: number }[];
  bookingId?: string;
}

/**
 * Formulaire public de réservation : 4 sections (B2B optionnel, infos
 * perso, adresse, permis) + pièces jointes + acceptation CGL. La logique
 * de soumission (check dispo + erreur formattée + Stripe Checkout) est
 * dans `useBookingSubmit`.
 */
export const BookingForm = ({
  onBack,
  vehicle,
  agency,
  startDate,
  endDate,
  numberOfDays,
  totalPrice,
  selectedOptions,
  bookingId,
}: BookingFormProps) => {
  const countries = useMemo(() => getCountriesListWithPriority(), []);

  // numberOfDays vient du hook useBookingSummary partagé au niveau du parent.
  const areDatesValid = numberOfDays >= 1;

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<BookingFormData>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      birthDate: "",
      birthPlace: "",
      address: "",
      address2: "",
      postalCode: "",
      city: "",
      country: "",
      driverLicenseNumber: "",
      driverLicenseIssuedAt: "",
      driverLicenseCountry: "",
      isBusiness: false,
      companyName: "",
      siret: "",
      vatNumber: "",
      acceptTerms: false,
    },
  });

  // eslint-disable-next-line react-hooks/incompatible-library
  const isBusiness = watch("isBusiness");

  const { bookingError, stagedDocs, setStagedDocs, submit } = useBookingSubmit({
    vehicle,
    agencyId: agency.id,
    startDate,
    endDate,
    totalPrice,
    selectedOptions,
    bookingId,
  });

  return (
    <div className="rounded-xl border border-gray-300 bg-white p-6">
      <div className="mb-6">
        <Button
          type="button"
          onClick={onBack}
          variant="default"
          size="xs"
          className="mb-4 group"
        >
          <ArrowLeft className="size-3 group-hover:-translate-x-1 transition-all duration-300" />
          Retour
        </Button>
        <h2 className="text-2xl font-bold">Vos informations</h2>
      </div>

      {bookingError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          {bookingError}
        </div>
      )}

      <form onSubmit={handleSubmit(submit)} className="space-y-8">
        <BusinessSection
          register={register}
          control={control}
          errors={errors}
          isBusiness={!!isBusiness}
        />

        <PersonalInfoSection
          register={register}
          control={control}
          errors={errors}
        />

        <AddressSection
          register={register}
          control={control}
          errors={errors}
          countries={countries}
        />

        <DriverLicenseSection
          register={register}
          control={control}
          errors={errors}
          countries={countries}
        />

        <CustomerDocumentsUpload value={stagedDocs} onChange={setStagedDocs} />

        <TermsCheckbox
          control={control}
          errors={errors}
          agencyId={agency.id}
          agencyName={agency.name}
        />

        <div className="pt-4">
          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting || !areDatesValid}
          >
            {isSubmitting ? "Traitement en cours..." : "Confirmer et payer"}
          </Button>
        </div>
      </form>
    </div>
  );
};
