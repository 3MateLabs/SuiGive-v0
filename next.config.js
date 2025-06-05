/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Ensure transpilation works correctly for all dependencies
  transpilePackages: ['framer-motion'],
  // Configure external image domains if needed
  images: {
    domains: [
      'ipfs.io', 
      'cloudflare-ipfs.com', 
      'gateway.pinata.cloud', 
      'dweb.link', 
      'media.istockphoto.com', 
      'i.ibb.co', 
      'images.unsplash.com', 
      'pbs.twimg.com', 
      'blog.sui.io', 
      'picsum.photos',
      'suiexplorer.com',
      'explorer.sui.io',
      'fullnode.testnet.sui.io',
      'sui-testnet.nodeinfra.com',
      'sui-testnet-rpc.allthatnode.com',
      'placehold.co',
      'via.placeholder.com'
    ],
  },
}

module.exports = nextConfig
