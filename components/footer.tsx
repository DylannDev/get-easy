/* eslint-disable react/no-unescaped-entities */
import Link from "next/link";
import { FaApplePay, FaStripe } from "react-icons/fa6";
import { RiVisaLine, RiMastercardFill } from "react-icons/ri";
import { FiPhone, FiMail } from "react-icons/fi";
import { Logo } from "./logo";

const PAYMENT_METHODS = [
  { icon: FaApplePay, label: "Apple Pay" },
  { icon: RiVisaLine, label: "Visa" },
  { icon: RiMastercardFill, label: "Mastercard" },
  { icon: FaStripe, label: "Stripe" },
] as const;

const CONTACT_INFO = {
  phone: "06 94 03 06 70",
  email: "contact@geteasy.fr",
  address: "4 Lotissement Mortin, 97354 Rémire-Montjoly",
} as const;

export const Footer = () => {
  return (
    <footer className="bg-black py-8 text-gray-100">
      <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col gap-8">
        {/* Top section */}
        <div className="flex flex-col lg:flex-row py-4 items-center lg:items-start justify-between gap-8">
          {/* Logo and slogan */}
          <Logo width={150} variant="white" />

          {/* Contact info */}
          <div className="flex flex-col items-center lg:items-start gap-3 text-sm">
            <h3 className="text-green font-semibold mb-1 text-base">Contact</h3>
            <a
              href={`tel:${CONTACT_INFO.phone.replace(/\s/g, "")}`}
              className="flex items-center gap-2 text-gray-400 hover:text-green transition-colors"
            >
              <FiPhone className="size-4" />
              <span>{CONTACT_INFO.phone}</span>
            </a>
            <a
              href={`mailto:${CONTACT_INFO.email}`}
              className="flex items-center gap-2 text-gray-400 hover:text-green transition-colors"
            >
              <FiMail className="size-4" />
              <span>{CONTACT_INFO.email}</span>
            </a>
            {/* <div className="flex items-start gap-0 lg:gap-2 text-gray-400">
              <FiMapPin className="size-4 mt-0.5 shrink-0" />
              <span className="max-w-40 text-center lg:text-left">
                {CONTACT_INFO.address}
              </span>
            </div> */}
          </div>

          {/* Legal links */}
          <div className="flex flex-col items-center lg:items-start gap-3 text-sm">
            <h3 className="text-green font-semibold mb-1 text-base">Légal</h3>
            <Link
              href="/mentions-legales"
              className="text-gray-400 hover:text-green transition-colors"
            >
              Mentions Légales
            </Link>
            <Link
              href="/conditions-generales-de-location"
              className="text-gray-400 hover:text-green transition-colors"
            >
              Conditions Générales de Location
            </Link>
          </div>

          {/* Payment methods */}
          <div className="flex flex-col items-center lg:items-start gap-3">
            <h3 className="text-green font-semibold mb-1 text-base">
              Paiement sécurisé
            </h3>
            <div className="flex items-center gap-2 text-xl text-green">
              {PAYMENT_METHODS.map((method) => {
                const Icon = method.icon;
                return (
                  <span
                    key={method.label}
                    className="rounded bg-green/15 px-3 py-1"
                    aria-label={method.label}
                  >
                    <Icon />
                  </span>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex flex-col-reverse lg:flex-row gap-6 items-center justify-between pt-8 border-t border-gray-700">
          {/* Copyright */}
          <h3 className="text-center text-xs text-gray-400">
            © {new Date().getFullYear()} Get Easy - Location de voitures en
            Guyane
          </h3>

          {/* Made by */}
          <div className="font-title text-center text-xs text-gray-400">
            Réalisé par l'agence{" "}
            <a
              href="https://vizionweb.fr"
              target="_blank"
              rel="noopener noreferrer"
              className="text-green hover:underline transition-all"
            >
              Vizion Web
            </a>{" "}
            💫
          </div>
        </div>
      </div>
    </footer>
  );
};
