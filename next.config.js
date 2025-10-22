/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",

  // Worker thread problemini çözmek için ve external packages
  experimental: {
    workerThreads: false,
    cpus: 1,
    esmExternals: "loose",
    serverComponentsExternalPackages: ["sharp", "pdf-parse", "tesseract.js"],
  },

  // Webpack konfigürasyonu - worker problemleri için
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push({
        "tesseract.js": "commonjs tesseract.js",
      });
    }
    return config;
  },
};

module.exports = nextConfig;
