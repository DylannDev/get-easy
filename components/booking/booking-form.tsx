"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  bookingFormSchema,
  type BookingFormData,
} from "@/lib/validations/booking";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { NativeSelect } from "@/components/ui/native-select";
import { ArrowLeft } from "lucide-react";
import { PhoneInput } from "@/components/ui/phone-input";
import { getCountriesList } from "@/lib/countries";
import { cn } from "@/lib/utils";

interface BookingFormProps {
  onBack: () => void;
}

export const BookingForm = ({ onBack }: BookingFormProps) => {
  const countries = getCountriesList();

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
      country: "FR",
      driverLicenseNumber: "",
      driverLicenseIssuedAt: "",
      driverLicenseCountry: "FR",
    },
  });

  const onSubmit = async (data: BookingFormData) => {
    // Pour l'instant, on logue juste les données
    console.log("Données du formulaire :", data);
    // TODO: Implémenter la logique de soumission et paiement
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
            <FormField
              id="birthDate"
              label="Date de naissance"
              type="text"
              placeholder="JJ/MM/AAAA"
              {...register("birthDate")}
              error={errors.birthDate?.message}
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

          <NativeSelect
            id="country"
            label="Pays"
            required
            placeholder="Sélectionnez un pays"
            options={countries}
            error={errors.country?.message}
            {...register("country")}
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
            <FormField
              id="driverLicenseIssuedAt"
              label="Date d'obtention"
              type="text"
              placeholder="JJ/MM/AAAA"
              {...register("driverLicenseIssuedAt")}
              error={errors.driverLicenseIssuedAt?.message}
            />

            <NativeSelect
              id="driverLicenseCountry"
              label="Pays d'obtention"
              placeholder="Sélectionnez un pays"
              options={countries}
              error={errors.driverLicenseCountry?.message}
              {...register("driverLicenseCountry")}
            />
          </div>
        </div>

        {/* Bouton de soumission */}
        <div className="pt-4">
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Traitement en cours..." : "Confirmer et payer"}
          </Button>
        </div>
      </form>
    </div>
  );
};
