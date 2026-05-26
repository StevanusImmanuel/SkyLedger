import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */

  // Empty turbopack config to silence webpack warning
  turbopack: {},

  // Enable styled-components compiler to fix hydration issues
  compiler: {
    styledComponents: true,
  },

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

  // Experimental features for Vercel deployment
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
};

export default nextConfig;
