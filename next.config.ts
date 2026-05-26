import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */

  // Empty turbopack config to silence webpack warning
  turbopack: {},

  // Optimize images
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },

  // Disable source maps in development for faster builds
  productionBrowserSourceMaps: false,
};

export default nextConfig;
