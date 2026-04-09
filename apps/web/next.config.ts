import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https: blob:",
              "font-src 'self' https://fonts.gstatic.com",
              "connect-src 'self' https://*.base.org https://*.basescan.org https://api.developer.coinbase.com https://api.pinata.cloud https://gateway.pinata.cloud wss://*",
              "frame-src 'self'",
            ].join('; '),
          },
        ],
      },
      {
        // CORS for API routes
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ]
  },

  // External image domains for agent card images
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'gateway.pinata.cloud' },
      { protocol: 'https', hostname: '**.ipfs.dweb.link' },
      { protocol: 'https', hostname: 'placehold.co' },
    ],
  },

  // Transpile workspace packages
  transpilePackages: ['@agent-registry/shared'],
}

export default nextConfig
