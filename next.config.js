/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  productionBrowserSourceMaps: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  images: { unoptimized: true },
  // Keep headless Chrome + ExcelJS out of the client/server bundle graph.
  experimental: {
    serverComponentsExternalPackages: ['puppeteer-core', 'exceljs'],
  },
};

module.exports = nextConfig;
