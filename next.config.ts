import type { NextConfig } from 'next';

const isDevelopment = process.env.NODE_ENV === 'development';

// Content Security Policy configuration
const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline' ${isDevelopment ? "'unsafe-eval'" : ''} https://maps.googleapis.com https://maps.gstatic.com https://va.vercel-scripts.com https://vercel.live;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  img-src 'self' blob: data: https://*.supabase.co https://framerusercontent.com https://maps.googleapis.com https://maps.gstatic.com;
  font-src 'self' https://fonts.gstatic.com;
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  upgrade-insecure-requests;
  worker-src 'self' blob:;
  connect-src 'self' https://*.supabase.co https://api.resend.com https://maps.googleapis.com https://ipapi.co https://ip-api.com https://vitals.vercel-insights.com https://va.vercel-scripts.com https://vercel.live ${isDevelopment ? 'http://localhost:*' : ''};
`;

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

  // Security headers
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: '/(.*)',
        headers: [
          // {
          //   key: 'Content-Security-Policy',
          //   value: cspHeader.replace(/\s{2,}/g, ' ').trim()
          // },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          },
          ...(isDevelopment ? [] : [{
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload'
          }]),
        ],
      },
    ];
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
