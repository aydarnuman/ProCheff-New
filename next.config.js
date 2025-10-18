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
  // Relative assets for local development  
  assetPrefix: process.env.GITHUB_PAGES === 'true' ? '/ProCheff-New/' : '',
  // GitHub Pages base path only for production deployment
  basePath: process.env.GITHUB_PAGES === 'true' ? '/ProCheff-New' : '',
  // API routes'ları static export'ta çalışmaz, bu yüzden onları exclude edelim
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
};

module.exports = nextConfig;
