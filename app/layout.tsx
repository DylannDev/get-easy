import type { Metadata } from "next";
import { DM_Sans, Unbounded } from "next/font/google";
import "./globals.css";
import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";
import { Toaster } from "@/components/ui/sonner";

const dmsans = DM_Sans({
  variable: "--font-dmsans",
  subsets: ["latin"],
});

const unbounded = Unbounded({
  variable: "--font-unbounded",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Get Easy - Location de voiture en Guyane",
  description:
    "Louez votre voiture en Guyane avec Get Easy à Cayenne, Rémire-Montjoly, Matoury et à l'aéroport Félix Éboué. Réservation en ligne simple et rapide.",
  keywords: [
    "location voiture guyane",
    "location voiture rémire-montjoly",
    "location auto guyane",
    "louer voiture guyane",
    "get easy",
    "location véhicule guyane française",
  ],
  authors: [{ name: "Get Easy" }],
  openGraph: {
    type: "website",
    locale: "fr_FR",
    // url: "https://www.get-easy.fr",
    siteName: "Get Easy",
    title: "Get Easy - Location de voiture en Guyane",
    description:
      "Louez votre voiture en Guyane avec Get Easy. Réservation en ligne, assurance tous risques, kilométrage illimité.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className={`${dmsans.variable} ${unbounded.variable} antialiased`}>
        <Navbar />
        {children}
        <Toaster />
        <Footer />
      </body>
    </html>
  );
}
