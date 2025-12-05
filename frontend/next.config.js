const path = require("path");

/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  experimental: {
    externalDir: true,
    esmExternals: "loose",
  },
  transpilePackages: ["@suilend/sui-fe-next", "sonner"],
  images: {
    remotePatterns: [
      new URL("https://d29k09wtkr1a3e.cloudfront.net/steamm/**"),
      new URL("https://d29k09wtkr1a3e.cloudfront.net/suilend/**"),
    ],
  },
  devIndicators: false,
  webpack: (config, { isServer }) => {
    // CRITICAL: Force all React imports to use the same instance
    // Alias to the package DIRECTORY (not entry file) so react/jsx-dev-runtime works
    const reactDir = path.dirname(require.resolve("react/package.json"));
    const reactDomDir = path.dirname(require.resolve("react-dom/package.json"));

    config.resolve.alias = {
      ...config.resolve.alias,
      react: reactDir,
      "react-dom": reactDomDir,
    };

    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
    };

    return config;
  },
};
