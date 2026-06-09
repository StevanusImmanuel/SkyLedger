import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";
import path from "node:path";

const projectRoot = path.resolve(__dirname);

const createNextConfig = (phase: string): NextConfig => ({
  /* config options here */

  ...(phase === PHASE_DEVELOPMENT_SERVER
    ? {
        // Keep Turbopack dev scoped to this project instead of the iCloudDocs parent.
        turbopack: {
          root: projectRoot,
        },
      }
    : {}),

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

  // Experimental features
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
});

export default createNextConfig;
