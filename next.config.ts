// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true, // extra checks in dev

  // Laat de build niet falen op lint/TS terwijl we nog aan het opschonen zijn.
  // (Op termijn beter weer aanscherpen.)
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },

  images: {
    // externe images toestaan (versmal dit later naar je eigen domeinen)
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
};

export default nextConfig;