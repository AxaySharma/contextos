/** @type {import('next').NextConfig} */
const nextConfig = {
  // Required for react-pdf to work in Next.js App Router
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    config.resolve.alias.encoding = false;
    return config;
  },
};

export default nextConfig;
