/* eslint-disable react/no-unescaped-entities */
"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  bookingFormSchema,
  type BookingFormData,
} from "@/lib/validations/booking";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { NativeSelect } from "@/components/ui/native-select";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft } from "lucide-react";
import { PhoneInput } from "@/components/ui/phone-input";
import { getCountriesList } from "@/lib/countries";
import { cn, formatDateTimeFR } from "@/lib/utils";
import {
  handleDateInputChange,
  handleDateKeyDown,
} from "@/lib/format-date-input";
import { createBookingAction } from "@/actions/create-booking";
import { checkVehicleAvailability } from "@/actions/check-vehicle-availability";
import type { Vehicle } from "@/types";
import type { Database } from "@/lib/supabase/database.types";
import { toast } from "react-hot-toast";

type Agency = Database["public"]["Tables"]["agencies"]["Row"];

interface BookingFormProps {
  onBack: () => void;
  vehicle: Vehicle;
  agency: Agency;
  startDate: Date;
  endDate: Date;
  numberOfDays: number;
  totalPrice: number;
  bookingId?: string;
}

export const BookingForm = ({
  onBack,
  vehicle,
  agency,
  startDate,
  endDate,
  numberOfDays,
  totalPrice,
  bookingId,
}: BookingFormProps) => {
  // Extraire agencyId et agencyName depuis l'objet agency
  const agencyId = agency.id;
  const agencyName = agency.name;
  const router = useRouter();

  // Réorganiser la liste des pays avec une priorité pour les pays locaux
  const allCountries = getCountriesList();
  const priorityCountryCodes = ["FR", "GF", "MQ", "GP"]; // France, Guyane, Martinique, Guadeloupe

  const priorityCountries = allCountries.filter((country) =>
    priorityCountryCodes.includes(country.value)
  );
  const otherCountries = allCountries.filter(
    (country) => !priorityCountryCodes.includes(country.value)
  );

  // Réordonner les pays prioritaires selon l'ordre défini
  const orderedPriorityCountries = priorityCountryCodes
    .map((code) => priorityCountries.find((c) => c.value === code))
    .filter(Boolean) as typeof priorityCountries;

  const countries = [...orderedPriorityCountries, ...otherCountries];

  const [bookingError, setBookingError] = useState<string | null>(null);

  // Validation des dates : doit avoir au moins 1 jour de location
  // numberOfDays vient du hook useBookingSummary partagé au niveau du parent
  const areDatesValid = numberOfDays >= 1;

  const {
    register,
    handleSubmit,
    control,
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
      country: "", // Pas de valeur par défaut pour forcer la sélection
      driverLicenseNumber: "",
      driverLicenseIssuedAt: "",
      driverLicenseCountry: "",
      acceptTerms: false,
    },
  });

  const onSubmit = async (data: BookingFormData) => {
    try {
      setBookingError(null);

      // Vérifier la disponibilité avant de créer la réservation
      // En excluant le booking courant (si présent) pour permettre la modification
      const availabilityCheck = await checkVehicleAvailability({
        vehicleId: vehicle.id,
        startDate,
        endDate,
        excludeBookingId: bookingId, // Exclure le booking courant de la vérification
      });

      if (!availabilityCheck.available) {
        // Construire un message détaillé selon le type de conflit
        let message: string;

        if (availabilityCheck.conflictStart && availabilityCheck.conflictEnd) {
          const formattedStart = formatDateTimeFR(
            new Date(availabilityCheck.conflictStart)
          );
          const formattedEnd = formatDateTimeFR(
            new Date(availabilityCheck.conflictEnd)
          );

          switch (availabilityCheck.conflictStatus) {
            case "pending_payment":
              message = `Ce véhicule est en cours de réservation du ${formattedStart} au ${formattedEnd}. Veuillez sélectionner d'autres dates ou un autre véhicule.`;
              break;
            case "paid":
              message = `Ce véhicule est déjà réservé du ${formattedStart} au ${formattedEnd}. Veuillez sélectionner d'autres dates ou un autre véhicule.`;
              break;
            case "blocked_period":
              message = `Ce véhicule est indisponible du ${formattedStart} au ${formattedEnd}. Veuillez sélectionner d'autres dates ou un autre véhicule.`;
              break;
            default:
              message =
                "Ce véhicule n'est plus disponible pour la période sélectionnée. Merci de choisir d'autres dates ou un autre véhicule.";
          }
        } else {
          message =
            "Ce véhicule n'est plus disponible pour la période sélectionnée. Merci de choisir d'autres dates ou un autre véhicule.";
        }

        setBookingError(message);
        toast.error(message);
        return; // Empêche la soumission
      }

      // Appeler la Server Action pour créer la réservation et la session Stripe
      const result = await createBookingAction({
        customerData: data,
        vehicleId: vehicle.id,
        vehicleBrand: vehicle.brand,
        vehicleModel: vehicle.model,
        agencyId,
        startDate,
        endDate,
        totalPrice,
        bookingId, // Passer le bookingId pour mettre à jour le booking "initiated"
      });

      if (!result.success) {
        setBookingError(result.error || "Une erreur est survenue");
        toast.error(result.error || "Une erreur est survenue");
        return;
      }

      // Vérifier que nous avons une URL de checkout
      if (!result.checkoutUrl) {
        setBookingError("Impossible de créer la session de paiement");
        toast.error("Impossible de créer la session de paiement");
        return;
      }

      // Rediriger vers Stripe Checkout
      router.push(result.checkoutUrl);
    } catch (error) {
      console.error("❌ Erreur lors de la soumission:", error);
      setBookingError("Une erreur inattendue s'est produite");
      toast.error("Une erreur inattendue s'est produite");
    }
  };

  return (
    <div className="rounded-xl border border-gray-300 bg-white p-6">
      {/* En-tête avec bouton retour */}
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

      {/* Affichage de l'erreur de réservation */}
      {bookingError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          {bookingError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Section 1 - Infos générales */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold border-b border-gray-200 pb-2">
            Informations générales
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              id="firstName"
              label="Prénom"
              placeholder="John"
              required
              {...register("firstName")}
              error={errors.firstName?.message}
            />

            <FormField
              id="lastName"
              label="Nom"
              placeholder="Doe"
              required
              {...register("lastName")}
              error={errors.lastName?.message}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              id="email"
              label="Email"
              type="email"
              placeholder="john.doe@example.com"
              required
              {...register("email")}
              error={errors.email?.message}
            />

            <div className="flex flex-col">
              <label htmlFor="phone" className="text-sm font-medium mb-1">
                Téléphone <span className="text-red-500">*</span>
              </label>
              <Controller
                name="phone"
                control={control}
                render={({ field }) => (
                  <PhoneInput
                    {...field}
                    id="phone"
                    placeholder="Entrez votre numéro de téléphone"
                    className={cn(
                      errors.phone && "border-red-500",
                      "phone-input"
                    )}
                  />
                )}
              />
              {errors.phone && (
                <p className="text-xs text-red-600 mt-2">
                  {errors.phone.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Controller
              name="birthDate"
              control={control}
              render={({ field }) => (
                <FormField
                  id="birthDate"
                  label="Date de naissance"
                  type="text"
                  placeholder="JJ/MM/AAAA"
                  maxLength={10}
                  required
                  value={field.value}
                  onChange={(e) => handleDateInputChange(e, field.onChange)}
                  onKeyDown={(e) => handleDateKeyDown(e, field.onChange)}
                  onBlur={field.onBlur}
                  error={errors.birthDate?.message}
                />
              )}
            />

            <FormField
              id="birthPlace"
              label="Lieu de naissance"
              placeholder="Cayenne"
              {...register("birthPlace")}
              error={errors.birthPlace?.message}
            />
          </div>
        </div>

        {/* Section 2 - Adresse de facturation */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold border-b border-gray-200 pb-2">
            Adresse de facturation
          </h3>

          <FormField
            id="address"
            label="Adresse"
            placeholder="123 Rue de la Paix"
            required
            {...register("address")}
            error={errors.address?.message}
          />

          <FormField
            id="address2"
            label="Complément d'adresse"
            placeholder="Appartement, bâtiment, étage"
            {...register("address2")}
            error={errors.address2?.message}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              id="postalCode"
              label="Code postal"
              placeholder="97300"
              required
              {...register("postalCode")}
              error={errors.postalCode?.message}
            />

            <FormField
              id="city"
              label="Ville"
              placeholder="Cayenne"
              required
              {...register("city")}
              error={errors.city?.message}
            />
          </div>

          <Controller
            name="country"
            control={control}
            render={({ field }) => (
              <NativeSelect
                id="country"
                label="Pays"
                required
                placeholder="Sélectionnez un pays"
                options={countries}
                value={field.value}
                onValueChange={field.onChange}
                error={errors.country?.message}
              />
            )}
          />
        </div>

        {/* Section 3 - Infos permis de conduire */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold border-b border-gray-200 pb-2">
            Informations permis de conduire
          </h3>

          <FormField
            id="driverLicenseNumber"
            label="Numéro de permis"
            {...register("driverLicenseNumber")}
            error={errors.driverLicenseNumber?.message}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Controller
              name="driverLicenseIssuedAt"
              control={control}
              render={({ field }) => (
                <FormField
                  id="driverLicenseIssuedAt"
                  label="Date d'obtention"
                  type="text"
                  placeholder="JJ/MM/AAAA"
                  maxLength={10}
                  value={field.value}
                  onChange={(e) => handleDateInputChange(e, field.onChange)}
                  onKeyDown={(e) => handleDateKeyDown(e, field.onChange)}
                  onBlur={field.onBlur}
                  error={errors.driverLicenseIssuedAt?.message}
                />
              )}
            />

            <Controller
              name="driverLicenseCountry"
              control={control}
              render={({ field }) => (
                <NativeSelect
                  id="driverLicenseCountry"
                  label="Pays d'obtention"
                  placeholder="Sélectionnez un pays"
                  options={countries}
                  value={field.value}
                  onValueChange={field.onChange}
                  error={errors.driverLicenseCountry?.message}
                />
              )}
            />
          </div>
        </div>

        {/* Section 4 - Acceptation des conditions */}
        <div className="bg-green/40 p-2 rounded-md mb-0">
          <div className="flex items-start gap-3">
            <Controller
              name="acceptTerms"
              control={control}
              render={({ field }) => (
                <Checkbox
                  id="acceptTerms"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  onBlur={field.onBlur}
                  aria-invalid={!!errors.acceptTerms}
                  className="mt-0.5"
                />
              )}
            />
            <div className="flex-1">
              <label htmlFor="acceptTerms" className="text-sm cursor-pointer">
                J'accepte les{" "}
                <Link
                  href="/conditions-generales-de-location"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-black font-bold hover:underline"
                >
                  Conditions Générales de Location
                </Link>{" "}
                et que <strong>{agencyName}</strong> traite mes informations.{" "}
                <span className="text-red-500">*</span>
              </label>
              {errors.acceptTerms && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.acceptTerms.message}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Bouton de soumission */}
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
