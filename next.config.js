/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Ensure transpilation works correctly for all dependencies
  transpilePackages: ['framer-motion'],
  // Configure external image domains if needed
  images: {
    domains: ['ipfs.io', 'cloudflare-ipfs.com', 'gateway.pinata.cloud', 'dweb.link'],
  },
}

module.exports = nextConfig
