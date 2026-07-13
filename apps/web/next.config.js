/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@crytonet/shared'],
  output: 'standalone',
};

module.exports = nextConfig;
