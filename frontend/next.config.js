/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  
  async rewrites() {
    const backendUrl = process.env.BACKEND_URL || 'http://backend:8080';
    
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
}

module.exports = nextConfig

