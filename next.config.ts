import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "blthbfocnoowqzlsmwhx.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
    // Réduire le cache pour permettre des mises à jour plus fréquentes des images
    minimumCacheTTL: 60, // 60 secondes au lieu de 60 jours par défaut
  },
  experimental: {
    serverActions: {
      // Par défaut Next.js limite le body des Server Actions à 1 MB.
      // On passe à 10 MB pour permettre les uploads de signatures (3 MB),
      // documents et factures volumineuses.
      bodySizeLimit: "10mb",
    },
  },
  // Empêche Turbopack/webpack de bundler ces packages côté serveur — ils
  // chargent leurs propres workers/binaires natifs et doivent rester en
  // modules Node externes (sinon : "Cannot find module pdf.worker.mjs"
  // pour pdfjs-dist, et soucis de binaires natifs pour sharp).
  serverExternalPackages: [
    "pdf-to-img",
    "pdfjs-dist",
    "sharp",
    "@react-pdf/renderer",
    // Décodage HEIC via libheif compilé en WASM — doit rester externe pour
    // que Node charge le .wasm embarqué dans le package.
    "heic-convert",
    "heic-decode",
    "libheif-js",
  ],
};

export default nextConfig;
