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

  // Vercel-specific optimizations for middleware
  experimental: {
    optimizePackageImports: ["@radix-ui"],
  },

  // Ensure middleware builds correctly
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.optimization = {
        ...config.optimization,
        minimize: true,
      };
    }
    return config;
  },
};

export default nextConfig;
