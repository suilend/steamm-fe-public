const path = require("path");

/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  experimental: {
    externalDir: true,
    esmExternals: "loose",
  },
  transpilePackages: [
    "@suilend/sdk",
    "@suilend/springsui-sdk",
    "@suilend/steamm-sdk",
    "@suilend/sui-fe",
    "@suilend/sui-fe-next",
    "@mysten/dapp-kit-core",
    "@mysten/dapp-kit-react",
    "sonner",
    "geist",
  ],
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
      buffer: require.resolve("buffer/"),
    };

    if (!isServer) {
      config.plugins.push(
        new (require("webpack").NormalModuleReplacementPlugin)(
          /^node:/,
          (resource) => {
            resource.request = resource.request.replace(/^node:/, "");
          },
        ),
      );
    }
    if (isServer) {
      config.resolve.alias["@webcomponents/scoped-custom-element-registry"] =
        path.resolve(__dirname, "src/lib/empty.js");
      config.resolve.alias["@mysten/dapp-kit-core/web"] = path.resolve(
        __dirname,
        "src/lib/dapp-kit-core-web-stub.js",
      );
    }

    return config;
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
        ],
      },
    ];
  },
};
