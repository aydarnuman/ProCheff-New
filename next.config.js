const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.resolve.alias["@"] = path.resolve(__dirname, "./src");
    return config;
  },
  output: "standalone",
  async redirects() {
    return [
      {
        source: '/\\(admin\\)/:path*',
        destination: '/admin/:path*',
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
