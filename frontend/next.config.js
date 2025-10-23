/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  experimental: {
    externalDir: true,
    esmExternals: "loose",
  },
  transpilePackages: ["@suilend/sui-fe-next"],
  images: {
    remotePatterns: [
      new URL("https://d29k09wtkr1a3e.cloudfront.net/steamm/**"),
      new URL("https://d29k09wtkr1a3e.cloudfront.net/suilend/**"),
    ],
  },
  devIndicators: false,
  webpack: (config) => {
    config.resolve.fallback = { fs: false };

    return config;
  },
};
