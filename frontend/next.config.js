/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // API proxy is now handled by app/api/[...path]/route.ts
  // This allows BACKEND_URL to be read at runtime, not build time
}

module.exports = nextConfig

