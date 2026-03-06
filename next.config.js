/** @type {import('next').NextConfig} */
let nextConfig = {
  // Enable experimental optimizations
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui', 'framer-motion'],
    scrollRestoration: true,
  },
  // Compression
  compress: true,

  // Optimize production builds
  productionBrowserSourceMaps: false,
  swcMinify: true,

  // Suppress Edge Runtime warnings for Supabase
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    config.ignoreWarnings = [
      { module: /node_modules\/@supabase/ }
    ];
    return config;
  },

  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'https',
        hostname: 'pyhtzvpaspizeognpabr.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
    ],
    // Image optimization
    formats: ['image/avif', 'image/webp'],
    // Aggressive caching for images
    minimumCacheTTL: 31536000, // 1 year
  },

  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },

  async headers() {
    return [
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/manifest.webmanifest',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400',
          },
        ],
      },
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400',
          },
        ],
      },
    ]
  },

  async redirects() {
    return [
      // App routes
      {
        source: '/marketplace/group-buys',
        destination: '/marketplace/pools',
        permanent: true,
      },
      {
        source: '/marketplace/group-buys/:id',
        destination: '/marketplace/pools/:id',
        permanent: true,
      },
      // API routes
      {
        source: '/api/group-buys',
        destination: '/api/pools',
        permanent: true,
      },
      {
        source: '/api/group-buys/:id',
        destination: '/api/pools/:id',
        permanent: true,
      },
    ];
  },
}

let config = nextConfig

if (process.env.ANALYZE === 'true') {
  try {
    const withBundleAnalyzer = require('@next/bundle-analyzer')({
      enabled: true,
    })
    config = withBundleAnalyzer(nextConfig)
  } catch (e) {
    console.warn('Bundle analyzer not available, skipping')
  }
}

module.exports = config