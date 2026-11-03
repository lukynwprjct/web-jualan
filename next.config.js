/** @type {import('next').NextConfig} */
const nextConfig = {
  // Force Webpack instead of SWC for Termux compatibility
  webpack: (config) => {
    return config;
  },
  // Disable SWC minification
  swcMinify: false,
  // Use experimental fallback
  experimental: {
    // Force Node.js runtime
    serverComponentsExternalPackages: ['next'],
  },
}

module.exports = nextConfig
