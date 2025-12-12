/** @type {import('next').NextConfig} */
const nextConfig = {
  // For Capacitor native builds, use static export
  // For Vercel deployment, comment this out
  ...(process.env.BUILD_MODE === 'capacitor' ? { output: 'export' } : {}),
  
  // Disable image optimization for static export
  ...(process.env.BUILD_MODE === 'capacitor' ? { 
    images: { unoptimized: true },
    // Trailing slash helps with static file serving
    trailingSlash: true,
  } : {}),

  // Enable experimental features for better performance
  experimental: {
    // Server Actions are stable in Next.js 14+
  },
  
  // Headers for PWA and Service Worker support
  async headers() {
    return [
      {
        // Service Worker must have correct MIME type and scope headers
        source: '/OneSignalSDKWorker.js',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/javascript; charset=utf-8',
          },
          {
            key: 'Service-Worker-Allowed',
            value: '/',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
        ],
      },
      {
        // Also handle any legacy sw.js requests
        source: '/sw.js',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/javascript; charset=utf-8',
          },
          {
            key: 'Service-Worker-Allowed',
            value: '/',
          },
        ],
      },
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
