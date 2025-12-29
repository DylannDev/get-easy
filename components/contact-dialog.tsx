"use client";

import { FiPhone, FiMail, FiMapPin, FiClock } from "react-icons/fi";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  AlertDialogCancel,
} from "./ui/alert-dialog";
import { PiCar } from "react-icons/pi";

const CONTACT_INFO = {
  phone: "06 94 03 06 70",
  email: "contact@geteasy.fr",
  address: "4 Lotissement Mortin, 97354 Rémire-Montjoly",
  hours: "7h - 22h 7j/7",
} as const;

const CONTACT_ITEMS = [
  {
    id: "phone",
    icon: FiPhone,
    label: "Téléphone",
    value: CONTACT_INFO.phone,
    href: `tel:${CONTACT_INFO.phone.replace(/\s/g, "")}`,
    clickable: true,
  },
  {
    id: "email",
    icon: FiMail,
    label: "Email",
    value: CONTACT_INFO.email,
    href: `mailto:${CONTACT_INFO.email}`,
    clickable: true,
  },
  {
    id: "address",
    icon: FiMapPin,
    label: "Adresse",
    value: CONTACT_INFO.address,
    clickable: false,
  },
  {
    id: "hours",
    icon: FiClock,
    label: "Horaires",
    value: CONTACT_INFO.hours,
    clickable: false,
  },
] as const;

const DELIVERY_INFO = {
  title: "Livraison gratuite",
  description: "Cayenne, Rémire-Montjoly, Matoury et Aéroport",
} as const;

interface ContactDialogProps {
  children: React.ReactNode;
}

export const ContactDialog = ({ children }: ContactDialogProps) => {
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
          {/* Contact items */}
          {CONTACT_ITEMS.map((item) => {
            const Icon = item.icon;
            const Component = item.clickable ? "a" : "div";
            const props = item.clickable ? { href: item.href } : {};

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
                  <p className="text-sm font-semibold">{item.value}</p>
                </div>
              </Component>
            );
          })}

          {/* Free delivery */}
          <div className="flex items-center gap-3 p-3 rounded-lg">
            <div className="flex items-center justify-center size-10 rounded-full bg-black">
              <PiCar className="size-5 text-green" />
            </div>
            <div>
              <p className="text-sm font-semibold">{DELIVERY_INFO.title}</p>
              <p className="text-xs text-gray-500">
                {DELIVERY_INFO.description}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <AlertDialogCancel className="w-full">Fermer</AlertDialogCancel>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
};
