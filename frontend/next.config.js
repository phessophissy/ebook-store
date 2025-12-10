/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Required for @stacks packages
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    return config;
  },
};

module.exports = nextConfig;
