/** @type {import('next').NextConfig} */
const nextConfig = {
  // Force Next.js to include the documents-store in the standalone build/Vercel functions
  output: 'standalone',
  experimental: {
    outputFileTracingIncludes: {
      '/': ['./documents-store/**/*'],
    },
  },
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    return config;
  },
};

export default nextConfig;
