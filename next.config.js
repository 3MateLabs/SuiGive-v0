/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      'pbs.twimg.com',      // Twitter images
      'i.imgur.com',        // Imgur
      'images.unsplash.com', // Unsplash
      'cloudflare-ipfs.com', // IPFS via Cloudflare
      'ipfs.io',            // IPFS
      'arweave.net',        // Arweave
      'storage.googleapis.com', // Google Cloud Storage
      's3.amazonaws.com',   // AWS S3
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

module.exports = nextConfig;
