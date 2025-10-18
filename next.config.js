const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.resolve.alias["@"] = path.resolve(__dirname, "./src");
    return config;
  },
  // Static export configuration
  output: "export",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  // GitHub Pages static paths - always active for export
  assetPrefix: '/ProCheff-New/',
  basePath: '/ProCheff-New',
  // API routes'ları static export'ta çalışmaz, bu yüzden onları exclude edelim
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
};

module.exports = nextConfig;
