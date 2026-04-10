/** @type {import('next').NextConfig} */
const nextConfig = {
  // Required for static hosts (e.g. Render Static Site → publish `out/`)
  output: "export",
  images: {
    unoptimized: true, // disables Next.js image optimization
  },
};

module.exports = nextConfig;