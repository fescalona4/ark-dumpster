import type { NextConfig } from 'next';

const isDevelopment = process.env.NODE_ENV === 'development';


const nextConfig: NextConfig = {
  images: {
    // SECURITY: Restrict image sources to trusted domains only
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'framerusercontent.com',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'maps.googleapis.com',
      },
      {
        protocol: 'https',
        hostname: 'maps.gstatic.com',
      },
      // Development only
      ...(isDevelopment ? [{
        protocol: 'http' as const,
        hostname: 'localhost',
        port: '3000',
        pathname: '/api/image-proxy**',
      }] : []),
    ],
  },


  experimental: {
    optimizePackageImports: ['@remixicon/react', '@radix-ui/react-icons', '@tabler/icons-react'],
  },
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  devIndicators: false,
  
  // Disable service worker in development
  ...(isDevelopment && {
    headers: async () => [
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
      },
    ],
  }),

  // Proxy configuration for corporate networks - development only
  ...(isDevelopment && {
    async rewrites() {
      return [
        // Proxy Supabase REST API calls through Next.js to bypass corporate firewall
        {
          source: '/proxy/supabase/rest/:path*',
          destination: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/:path*`,
        },
        // Proxy Supabase auth calls
        {
          source: '/proxy/supabase/auth/:path*',
          destination: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/:path*`,
        },
        // Proxy Supabase storage for image optimization
        {
          source: '/proxy/supabase/storage/:path*',
          destination: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/:path*`,
        },
        // Proxy general Supabase calls (fallback)
        {
          source: '/proxy/supabase/:path*',
          destination: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/:path*`,
        },
        // Proxy Resend API calls
        {
          source: '/proxy/resend/:path*',
          destination: 'https://api.resend.com/:path*',
        },
        // Proxy Google Maps API
        {
          source: '/proxy/google-maps/:path*',
          destination: 'https://maps.googleapis.com/:path*',
        },
      ];
    },
  }),
};

export default nextConfig;
