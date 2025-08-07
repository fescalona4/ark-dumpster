import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Set to true for static exports or when external image optimization is preferred
    // This allows Next.js Image component benefits (lazy loading, aspect ratio, etc.)
    // without requiring a running Next.js server for image optimization
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'framerusercontent.com',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
