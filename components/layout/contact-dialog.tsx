"use client";

import { FiPhone, FiMail, FiMapPin, FiClock } from "react-icons/fi";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { PiCar } from "react-icons/pi";
import type { ContactInfo } from "./navbar";

const DEFAULT_CONTACT: ContactInfo = {
  phone: "06 94 03 06 70",
  email: "contact@geteasylocation.com",
  address: "4 Lotissement Mortin, 97354 Rémire-Montjoly",
  hours: "07:00 - 22:00 7j/7",
  deliveryLabel: "Livraison gratuite",
  deliveryZones: "Cayenne, Rémire-Montjoly, Matoury et Aéroport",
};

interface ContactDialogProps {
  children: React.ReactNode;
  contactInfo?: ContactInfo;
}

export const ContactDialog = ({
  children,
  contactInfo,
}: ContactDialogProps) => {
  const info = contactInfo ?? DEFAULT_CONTACT;

  const contactItems = [
    {
      id: "phone",
      icon: FiPhone,
      label: "Téléphone",
      value: info.phone,
      href: `tel:${info.phone.replace(/\s/g, "")}`,
      clickable: true,
    },
    {
      id: "email",
      icon: FiMail,
      label: "Email",
      value: info.email,
      href: `mailto:${info.email}`,
      clickable: true,
    },
    {
      id: "address",
      icon: FiMapPin,
      label: "Adresse",
      value: info.address,
      clickable: false,
    },
    {
      id: "hours",
      icon: FiClock,
      label: "Horaires",
      value: info.hours,
      clickable: false,
    },
  ];

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild suppressHydrationWarning>
        {children}
      </AlertDialogTrigger>
      <AlertDialogContent
        className="max-w-[350px] sm:max-w-md mx-auto"
        suppressHydrationWarning
      >
        <AlertDialogHeader>
          <AlertDialogTitle className="text-2xl text-center mb-2">
            Contactez-nous
          </AlertDialogTitle>
        </AlertDialogHeader>

        <div className="flex flex-col gap-4">
          {contactItems.map((item) => {
            const Icon = item.icon;
            const Component = item.clickable ? "a" : "div";
            const props = item.clickable
              ? { href: item.href as string }
              : {};

            return (
              <Component
                key={item.id}
                {...props}
                className={`flex items-start gap-3 p-3 rounded-lg ${
                  item.clickable ? "hover:bg-green/50 transition-colors" : ""
                }`}
              >
                <div className="flex items-center justify-center size-10 rounded-full bg-black shrink-0">
                  <Icon className="size-5 text-green" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">
                    {item.label}
                  </p>
                  <p className="text-sm font-semibold whitespace-pre-line">{item.value}</p>
                </div>
              </Component>
            );
          })}

          {info.deliveryLabel && (
            <div className="flex items-center gap-3 p-3 rounded-lg">
              <div className="flex items-center justify-center size-10 rounded-full bg-black">
                <PiCar className="size-5 text-green" />
              </div>
              <div>
                <p className="text-sm font-semibold">{info.deliveryLabel}</p>
                <p className="text-xs text-gray-500">{info.deliveryZones}</p>
              </div>
            </div>
          )}
        </div>

        <div className="mt-4">
          <AlertDialogCancel className="w-full">Fermer</AlertDialogCancel>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
};
