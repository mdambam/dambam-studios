/** @type {import('next').NextConfig} */
const projectRoot = new URL('.', import.meta.url).pathname
const nextConfig = {
  turbopack: {
    root: projectRoot,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'replicate.delivery',
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api/proxy/:path*',
        destination: 'http://localhost:5000/api/:path*', // The Secret Tunnel
      },
    ];
  },
};

export default nextConfig;