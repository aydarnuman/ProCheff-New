const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.resolve.alias["@"] = path.resolve(__dirname, "./src");
    return config;
  },
  // GitHub Pages için static export
  output: "export",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  // GitHub Pages base path (repository adı)
  basePath: process.env.NODE_ENV === 'production' ? '/ProCheff-New' : '',
  assetPrefix: process.env.NODE_ENV === 'production' ? '/ProCheff-New/' : '',
  // API routes'ları static export'ta çalışmaz, bu yüzden onları exclude edelim
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
};

module.exports = nextConfig;
