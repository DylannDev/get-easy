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
};

export default nextConfig;
