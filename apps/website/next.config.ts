/** @type {import('next').NextConfig} */
const nextConfig = {
  // Keep dynamic routes usable in local dev.
  // Static export is still enabled for production builds/deploys.
  output: process.env.NODE_ENV === "production" ? "export" : undefined,
  images: {
    unoptimized: true, // disables Next.js image optimization
  },
};

module.exports = nextConfig;